import VeritasFactCheck from '@/components/home'
import React from 'react'
import Orb from '@/components/Orb'

function page() {
  return (
    <div className="relative min-h-screen">
      {/* Orb background - fixed to viewport */}
      <div className="fixed inset-0 w-full h-full pointer-events-none z-0">
        <Orb
          hoverIntensity={1}
          rotateOnHover={true}
          hue={204}
          forceHoverState={true}
        />
      </div>
      
      {/* Content - scrollable */}
      <div className=" z-10 pointer-events-auto">
        <VeritasFactCheck/>
      </div>
    </div>
  )
}

export default page