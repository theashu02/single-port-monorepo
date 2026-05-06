import React from 'react'

export default function DiscoverPage() {
  return (
    <div className="w-full h-full min-w-0">
      <div className="h-full" style={{ opacity: 1, transform: 'none' }}>
        <div className="flex flex-col h-full p-4 lg:p-6 gap-4 min-w-0">
          
          <div className="relative flex-1 min-h-0 rounded-3xl overflow-hidden glass border border-white/10 grid-bg">
            
            <div className="absolute -top-24 -left-24 h-80 w-80 rounded-full bg-violet-600/30 blur-3xl"></div>
            <div className="absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-cyan-400/20 blur-3xl"></div>
            <div className="absolute top-1/3 left-1/2 h-72 w-72 rounded-full bg-fuchsia-500/15 blur-3xl"></div>
            
            <div className="relative z-10 h-full w-full flex flex-col items-center justify-center px-6" style={{ opacity: 1, transform: 'none' }}>
              <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-500/20 border border-rose-400/30">
                <span className="relative h-2 w-2 rounded-full bg-rose-400 pulse-ring"></span>
                <span className="text-[11px] font-bold tracking-widest uppercase text-rose-200">Live Match</span>
              </div>
              <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-flame h-3.5 w-3.5 text-orange-400" aria-hidden="true"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path></svg>
                <span className="text-xs font-semibold text-white/80">98% match</span>
              </div>
              
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-violet-500 via-fuchsia-500 to-cyan-400 blur-2xl opacity-60"></div>
                <span className="flex shrink-0 overflow-hidden rounded-full relative h-36 w-36 ring-4 ring-white/20 shadow-2xl">
                  <img className="aspect-square h-full w-full" src="https://api.dicebear.com/7.x/adventurer/svg?seed=pixel_dreamer&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf&backgroundType=gradientLinear" alt="Avatar" />
                </span>
                <span className="pulse-ring absolute bottom-2 right-2 h-5 w-5 rounded-full bg-emerald-400 ring-4 ring-[#0c0a18]"></span>
              </div>
              
              <h2 className="mt-6 text-3xl font-black tracking-tight">pixel_dreamer<span className="text-white/40 text-lg font-normal ml-2">· 21</span></h2>
              <p className="mt-1 text-sm text-white/60">🇯🇵 Tokyo</p>
              
              <div className="flex gap-2 mt-4 flex-wrap justify-center">
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/5 border border-white/10 text-white/80">#anime</span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/5 border border-white/10 text-white/80">#lo-fi</span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/5 border border-white/10 text-white/80">#art</span>
              </div>
              
            
              <div className="mt-8 flex items-center gap-3">
                <button className="grid place-items-center h-12 w-12 rounded-full border border-white/10 transition bg-white/15 text-white" tabIndex={0}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-mic h-5 w-5" aria-hidden="true"><path d="M12 19v3"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><rect x="9" y="2" width="6" height="13" rx="3"></rect></svg>
                </button>
                <button className="grid place-items-center h-12 w-12 rounded-full border border-white/10 transition bg-white/15 text-white" tabIndex={0}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-video h-5 w-5" aria-hidden="true"><path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5"></path><rect x="2" y="6" width="14" height="12" rx="2"></rect></svg>
                </button>
                <button className="h-14 px-7 rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-400 text-white font-bold text-sm tracking-wide shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 transition flex items-center gap-2" tabIndex={0} style={{ transform: 'none' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-shuffle h-4 w-4" aria-hidden="true"><path d="m18 14 4 4-4 4"></path><path d="m18 2 4 4-4 4"></path><path d="M2 18h1.973a4 4 0 0 0 3.3-1.7l5.454-8.6a4 4 0 0 1 3.3-1.7H22"></path><path d="M2 6h1.972a4 4 0 0 1 3.6 2.2"></path><path d="M22 18h-6.041a4 4 0 0 1-3.3-1.8l-.359-.45"></path></svg> Next Vibe
                </button>
                <button className="grid place-items-center h-12 w-12 rounded-full border border-white/10 transition bg-white/5 text-white/70 hover:bg-rose-500/20 hover:text-rose-300" tabIndex={0} style={{ transform: 'none' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-heart h-5 w-5" aria-hidden="true"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path></svg>
                </button>
                <button className="grid place-items-center h-12 w-12 rounded-full border border-white/10 transition bg-white/5 text-white/50 hover:bg-white/10 hover:text-white" tabIndex={0} style={{ transform: 'none' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-skip-forward h-5 w-5" aria-hidden="true"><polygon points="5 4 15 12 5 20 5 4"></polygon><line x1="19" x2="19" y1="5" y2="19"></line></svg>
                </button>
              </div>
            </div>
          </div>
          
        
          <div className="rounded-3xl glass border border-white/10 overflow-hidden flex flex-col h-[280px]">
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-sparkles h-4 w-4 text-violet-300" aria-hidden="true"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"></path><path d="M20 3v4"></path><path d="M22 5h-4"></path><path d="M4 17v2"></path><path d="M5 18H3"></path></svg>
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-white/60">Live Chat</span>
              </div>
              <span className="text-[10px] text-white/40">end-to-end • anonymous</span>
            </div>
            
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2">
              <div className="flex justify-start" style={{ opacity: 1, transform: 'none' }}>
                <div className="max-w-[70%] px-4 py-2 rounded-2xl text-sm bg-white/8 text-white/90 rounded-bl-sm border border-white/5">yo new here? 👀</div>
              </div>
              <div className="flex justify-end" style={{ opacity: 1, transform: 'none' }}>
                <div className="max-w-[70%] px-4 py-2 rounded-2xl text-sm bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white rounded-br-sm">haha yeah just vibing</div>
              </div>
              <div className="flex justify-start" style={{ opacity: 1, transform: 'none' }}>
                <div className="max-w-[70%] px-4 py-2 rounded-2xl text-sm bg-white/8 text-white/90 rounded-bl-sm border border-white/5">based. what music u into?</div>
              </div>
            </div>
            
            <div className="p-3 border-t border-white/5 flex items-center gap-2">
              <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-10 w-10 rounded-full text-white/60 hover:text-white hover:bg-white/5">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-smile h-4 w-4" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><path d="M8 14s1.5 2 4 2 4-2 4-2"></path><line x1="9" y2="9.01" y1="9" y2="9"></line><line x1="15" x2="15.01" y1="9" y2="9"></line></svg>
              </button>
              <input className="flex w-full border px-3 py-1 shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground focus-visible:outline-none focus-visible:ring-1 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm flex-1 h-10 bg-white/5 border-white/10 rounded-full text-sm placeholder:text-white/30 focus-visible:ring-violet-500/50" placeholder="Drop a vibe..." defaultValue="" />
              <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 shadow hover:bg-primary/90 py-2 h-10 px-4 rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 text-white font-semibold text-sm hover:opacity-90">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-send h-4 w-4 mr-1" aria-hidden="true"><path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"></path><path d="m21.854 2.147-10.94 10.939"></path></svg> Send
              </button>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  )
}
