import { ChartBarInteractive } from '@/components/ui/shadcn-io/bar-chart-01'

function BarChart01({ dataType }: { dataType?: "complaint" | "feedback" }) {
  return (
    <ChartBarInteractive dataType={dataType} />
  )
}

export default BarChart01