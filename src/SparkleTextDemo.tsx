import SparkleText, { type SparkleTextProps } from './SparkleText'

export default function SparkleTextDemo(props: SparkleTextProps) {
  return (
    <div style={{ padding: 100, border: '1px solid #222' }}>
      <SparkleText {...props} />
    </div>
  )
}
