import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface SummaryItem {
  label: string;
  value: string;
}

interface BookingSummaryProps {
  title: string;
  items: SummaryItem[];
  total?: { label: string; value: string };
}

export function BookingSummary({ title, items, total }: BookingSummaryProps) {
  return (
    <Card className="shadow-warm border-0 rounded-xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-[family-name:var(--font-display)]">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex justify-between text-sm">
            <span className="text-muted-foreground">{item.label}</span>
            <span className="font-medium">{item.value}</span>
          </div>
        ))}
        {total && (
          <>
            <Separator className="my-3" />
            <div className="flex justify-between text-base font-semibold pt-1">
              <span className="font-[family-name:var(--font-display)]">{total.label}</span>
              <span className="font-[family-name:var(--font-display)]">{total.value}</span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
