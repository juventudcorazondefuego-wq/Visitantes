import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, CheckCircle, AlertCircle, Calendar, LogIn } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ChartData {
  date: string;
  ingresos: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState({
    total: 0,
    autorizados: 0,
    noAutorizados: 0,
    proximosVencer: 0,
    ingresados: 0,
  });
  const [chartData, setChartData] = useState<ChartData[]>([]);

  useEffect(() => {
    loadStats();
    
    // Subscribe to realtime changes
    const channel = supabase
      .channel('dashboard-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'visitantes_autorizados'
        },
        () => {
          loadStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadStats = async () => {
    const { data: visitors } = await supabase
      .from('visitantes_autorizados')
      .select('*');

    if (visitors) {
      const today = new Date();
      const in7Days = new Date();
      in7Days.setDate(today.getDate() + 7);

      setStats({
        total: visitors.length,
        autorizados: visitors.filter(v => v.autorizado).length,
        noAutorizados: visitors.filter(v => !v.autorizado).length,
        proximosVencer: visitors.filter(v => {
          const fecha = new Date(v.fecha_autorizacion);
          return v.autorizado && fecha <= in7Days && fecha >= today;
        }).length,
        ingresados: visitors.filter(v => v.last_entry !== null).length,
      });

      // Calculate chart data - last 7 days
      const last7Days: ChartData[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);
        
        const count = visitors.filter(v => {
          if (!v.last_entry) return false;
          const entryDate = new Date(v.last_entry);
          return entryDate >= date && entryDate < nextDate;
        }).length;
        
        last7Days.push({
          date: date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }),
          ingresos: count
        });
      }
      
      setChartData(last7Days);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Resumen del sistema de visitantes</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Visitantes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Registros en el sistema</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Autorizados</CardTitle>
            <CheckCircle className="h-4 w-4" style={{ color: 'hsl(var(--success))' }} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: 'hsl(var(--success))' }}>{stats.autorizados}</div>
            <p className="text-xs text-muted-foreground">Con acceso permitido</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">No Autorizados</CardTitle>
            <AlertCircle className="h-4 w-4" style={{ color: 'hsl(var(--destructive))' }} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: 'hsl(var(--destructive))' }}>{stats.noAutorizados}</div>
            <p className="text-xs text-muted-foreground">Acceso denegado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Próximos a Vencer</CardTitle>
            <Calendar className="h-4 w-4" style={{ color: 'hsl(48 100% 50%)' }} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: 'hsl(48 100% 50%)' }}>{stats.proximosVencer}</div>
            <p className="text-xs text-muted-foreground">En los próximos 7 días</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Han Ingresado</CardTitle>
            <LogIn className="h-4 w-4" style={{ color: 'hsl(var(--primary))' }} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: 'hsl(var(--primary))' }}>{stats.ingresados}</div>
            <p className="text-xs text-muted-foreground">Visitantes que han ingresado</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Evolución de Ingresos (Últimos 7 días)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="date" 
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '0.5rem',
                    color: 'hsl(var(--foreground))'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="ingresos" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))' }}
                  activeDot={{ r: 6 }}
                  name="Ingresos"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
