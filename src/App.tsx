import './App.css'
import SparkleText from './SparkleText'
import '@fontsource/metal-mania'
import '@fontsource/codystar'
import '@fontsource/orbitron'
import '@fontsource/cinzel-decorative'

function App() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        fontSize: '5rem',
        gap: 50,
        width: '100%',
        height: '100%',
        paddingTop: 100,
      }}
    >
      <SparkleText
        style={{ color: '#ccc', fontFamily: 'Cinzel Decorative' }}
        emissionRate={20000}
        maxParticles={1000}
        spread={Math.PI / 3}
        particleSize={{ min: 0.5, max: 1 }}
      >
        SPARKLE TEXT
      </SparkleText>

      <SparkleText
        style={{ color: '#bbb', fontFamily: 'Codystar' }}
        colors={['hsl(60, 100%, 70%)']}
        emissionRate={100}
        gravity={150}
        speed={100}
        ttl={{ min: 0.5, max: 0.9 }}
        particleSize={{ min: 0.4, max: 1 }}
      >
        SPARKLE TEXT
      </SparkleText>
      <SparkleText
        style={{ color: 'hsl(60, 100%, 40%)', fontFamily: 'Metal Mania', marginBottom: 30 }}
        colors={['hsl(60, 100%, 95%)']}
        emissionRate={100_000}
        maxParticles={10_000}
        particleSize={{ min: 0.25, max: 1 }}
        gravity={400}
        ttl={{ min: 0.5, max: 0.9 }}
      >
        SPARKLE TEXT
      </SparkleText>
      <SparkleText
        colors={['hsl(60, 100%, 95%)']}
        emissionRate={300}
        maxParticles={1000}
        particleSize={{ min: 0.25, max: 1 }}
        ttl={{ min: 0.5, max: 0.9 }}
      >
        ⭐️ &nbsp;&nbsp;&nbsp; 👽 &nbsp;&nbsp;&nbsp; ✨
      </SparkleText>
    </div>
  )
}

export default App
