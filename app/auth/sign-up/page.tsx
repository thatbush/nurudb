import { SignUpForm } from '@/components/sign-up-form'

export default function Page() {
  return (
    <div className="flex min-h-svh w-full">
      {/* Left Column - Content */}
      <div className="hidden w-1/2 flex-col justify-between p-8 text-white lg:flex relative">
        {/* Background with overlay */}
        <div className="absolute inset-0 z-0">
          <div
            className="absolute inset-0 bg-black/50"
            style={{
              backgroundImage: `url('/signup-bg.webp')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundPositionY: '10%',
              backgroundRepeat: 'no-repeat'
            }}
          >
            {/* Dark overlay */}
            <div className="absolute inset-0 bg-black/60"></div>
          </div>
        </div>

        {/* Content */}
        <div className="relative z-10">
          <div>
            <div className="flex items-center gap-2 text-xl font-bold">
              <div className="flex">
                <img src="/nuru-d-tp.png" alt="Nuru Logo" className="w-12 h-12" />
              </div>
              <p className='text-primary'>
                NuruDB
              </p>
            </div>
          </div>
        </div>

        <section className='relative z-10 mt-16 bottom-1 left-0 right-0'>
          <div className='grid grid-cols-2'>
            <div>
              <p className='text-primary text-xs'>© {new Date().getFullYear()} Nuru. All rights reserved. | Photo by <a href='https://pexels.com/@addibeka' className='text-primary hover:underline'>Kiptoo Addi</a></p>
            </div>
            <div className='flex justify-end'>
              <p className='text-primary text-xs'><a href='/terms' className='text-primary hover:underline'>Terms of Service</a> | <a href='/privacy' className='text-primary hover:underline'>Privacy Policy</a></p>
            </div>
          </div>
        </section>
      </div>

      <div className="flex w-full flex-col items-center justify-center p-6 md:p-10 lg:w-1/2 bg-secondary">
        <div className="w-full max-w-sm">
          <SignUpForm />
        </div>
      </div>
    </div>
  )
}
