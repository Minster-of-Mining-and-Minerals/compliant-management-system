import { ChartPieInteractive } from '@/components/ui/shadcn-io/pie-chart-11'

function PieChart11({ dataType }: { dataType?: "complaint" | "feedback" }) {
  return (
    <ChartPieInteractive dataType={dataType} />
  )
}

export default PieChart11