import './App.css'
import SparkleText from './SparkleText'
import '@fontsource/metal-mania'
import '@fontsource/codystar'
import '@fontsource/orbitron'
import '@fontsource/cinzel-decorative'

function App() {
  return (
    <div style={{ fontSize: '5rem', display: 'flex', flexDirection: 'column', gap: 50 }}>
      <SparkleText style={{ color: '#ccc', fontFamily: 'Cinzel Decorative' }} emissionRate={20000} maxParticles={1000} spread={Math.PI / 3}>
        SPARKLE TEXT
      </SparkleText>

      <SparkleText style={{ color: '#bbb', fontFamily: 'Codystar' }} colors={['hsl(60, 100%, 70%)']} emissionRate={10} gravity={150}>
        SPARKLE TEXT
      </SparkleText>
      <SparkleText
        style={{ color: 'hsl(60, 100%, 40%)', fontFamily: 'Metal Mania' }}
        colors={['hsl(60, 100%, 95%)']}
        emissionRate={100_000}
        maxParticles={20_000}
        particleSize={{ min: 0.25, max: 1 }}
      >
        SPARKLE TEXT
      </SparkleText>
      <SparkleText emissionRate={20000} maxParticles={1000}>
        ___underscore
      </SparkleText>
    </div>
  )
}

export default App
