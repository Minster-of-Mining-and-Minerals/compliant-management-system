import { ChartBarMixed } from "@/components/ui/shadcn-io/bar-chart-08";

function BarChart08({ dataType }: { dataType?: "complaint" | "feedback" }) {
  return <ChartBarMixed dataType={dataType} />;
}

export default BarChart08;
