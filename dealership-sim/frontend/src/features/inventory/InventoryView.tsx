import { GameState, Vehicle } from '@dealership/shared';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { useGameStore } from '../../state/useGameStore';

interface Props {
  state: GameState;
}

const InventoryView = ({ state }: Props) => {
  const { acquireInventory } = useGameStore();

  const grouped = state.inventory.reduce<Record<string, Vehicle[]>>((acc, vehicle) => {
    acc[vehicle.status] = acc[vehicle.status] || [];
    acc[vehicle.status].push(vehicle);
    return acc;
  }, {});

  const ageBadge = (age: number) => {
    if (age > 90) return <Badge variant="danger">Aged</Badge>;
    if (age > 60) return <Badge variant="warning">60+</Badge>;
    return <Badge variant="success">Fresh</Badge>;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Acquire Inventory</CardTitle>
          <CardDescription>Quickly top up desirable, balanced, or clearance inventory packs.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button onClick={() => acquireInventory('desirable', 5)}>Desirable Pack (5)</Button>
          <Button variant="outline" onClick={() => acquireInventory('neutral', 6)}>
            Balanced Pack (6)
          </Button>
          <Button variant="outline" onClick={() => acquireInventory('undesirable', 6)}>
            Value Pack (6)
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {(grouped['inStock'] || []).map((vehicle) => (
          <Card key={vehicle.id}>
            <CardHeader>
              <CardTitle>
                {vehicle.year} {vehicle.make} {vehicle.model}
              </CardTitle>
              <CardDescription>
                Stock #{vehicle.stockNumber} · {vehicle.segment.toUpperCase()} · {vehicle.condition.toUpperCase()}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2 text-sm text-slate-300">
              <div>
                <p>Asking</p>
                <p className="text-lg font-semibold text-foreground">${Math.round(vehicle.asking).toLocaleString()}</p>
              </div>
              <div>
                <p>Cost Basis</p>
                <p className="text-lg font-semibold text-foreground">${Math.round(vehicle.cost + vehicle.reconCost).toLocaleString()}</p>
              </div>
              <div>
                <p>Desirability</p>
                <p className="text-lg font-semibold">{Math.round(vehicle.desirability)}</p>
              </div>
              <div className="flex items-center gap-2">
                <p>Age: {vehicle.ageDays} days</p>
                {ageBadge(vehicle.ageDays)}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default InventoryView;
