import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOS } from './OSContext';
import { Icon } from './Icon';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const { notifications, clearNotifications, dismissNotification } = useOS();
  const [dndActive, setDndActive] = useState(false);
  const [nightLight, setNightLight] = useState(false);
  const [spatialAudio, setSpatialAudio] = useState(true);
  const [batterySaver, setBatterySaver] = useState(false);

  const now = new Date();
  const formattedDate = now.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Click Dismiss */}
          <div
            className="fixed inset-0 z-40 bg-black/10 backdrop-blur-[2px]"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, x: 380, scale: 0.98 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 380, scale: 0.98 }}
            transition={{ type: 'spring', damping: 26, stiffness: 280 }}
            className="liquid-glass-card fixed right-3 top-3 bottom-14 z-50 flex w-96 flex-col overflow-hidden rounded-2xl border-0 p-4 text-white shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Icon name="Bell" size={16} className="text-sky-400" />
                <span className="font-semibold text-sm">Notifications & Center</span>
              </div>
              <div className="flex items-center gap-2">
                {notifications.length > 0 && (
                  <button
                    onClick={clearNotifications}
                    className="rounded-lg px-2 py-1 text-xs text-white/60 hover:bg-white/10 hover:text-white"
                  >
                    Clear All
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="rounded-lg p-1 text-white/60 hover:bg-white/10 hover:text-white"
                >
                  <Icon name="X" size={16} />
                </button>
              </div>
            </div>

            {/* Notifications Feed */}
            <div className="flex-1 overflow-y-auto py-3 space-y-2.5">
              {notifications.length === 0 ? (
                <div className="flex h-40 flex-col items-center justify-center text-center text-white/40">
                  <Icon name="CheckCircle2" size={32} className="mb-2 text-emerald-400/60" />
                  <span className="text-xs font-medium">No new notifications</span>
                  <span className="text-[11px] text-white/30">You are all caught up</span>
                </div>
              ) : (
                notifications.map((n) => (
                  <motion.div
                    key={n.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="group relative rounded-xl bg-white/5 p-3 backdrop-blur-md transition-colors hover:bg-white/10"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2 text-xs font-medium text-sky-300">
                        <Icon name={n.icon} size={14} />
                        <span>{n.app}</span>
                        <span className="text-[10px] text-white/40">• {n.time}</span>
                      </div>
                      <button
                        onClick={() => dismissNotification(n.id)}
                        className="opacity-0 transition-opacity group-hover:opacity-100 rounded p-0.5 text-white/40 hover:bg-white/10 hover:text-white"
                      >
                        <Icon name="X" size={12} />
                      </button>
                    </div>
                    <div className="mt-1 text-xs font-semibold text-white/95">{n.title}</div>
                    <div className="mt-0.5 text-[11px] text-white/70 leading-relaxed">{n.message}</div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Quick Actions Matrix */}
            <div className="border-t border-white/10 pt-3">
              <div className="text-xs font-medium text-white/60 mb-2">Quick Actions</div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setDndActive(!dndActive)}
                  className={`flex items-center gap-2 rounded-xl p-2.5 text-left text-xs font-medium transition-all ${
                    dndActive
                      ? 'bg-sky-500/30 text-sky-200 ring-1 ring-sky-400/40'
                      : 'bg-white/5 text-white/70 hover:bg-white/10'
                  }`}
                >
                  <Icon name="Moon" size={16} className={dndActive ? 'text-sky-300' : 'text-white/50'} />
                  <div>
                    <div>Focus Assist</div>
                    <div className="text-[10px] text-white/40">{dndActive ? 'On' : 'Off'}</div>
                  </div>
                </button>

                <button
                  onClick={() => setNightLight(!nightLight)}
                  className={`flex items-center gap-2 rounded-xl p-2.5 text-left text-xs font-medium transition-all ${
                    nightLight
                      ? 'bg-amber-500/30 text-amber-200 ring-1 ring-amber-400/40'
                      : 'bg-white/5 text-white/70 hover:bg-white/10'
                  }`}
                >
                  <Icon name="Sun" size={16} className={nightLight ? 'text-amber-300' : 'text-white/50'} />
                  <div>
                    <div>Night Light</div>
                    <div className="text-[10px] text-white/40">{nightLight ? 'Warm 4000K' : 'Off'}</div>
                  </div>
                </button>

                <button
                  onClick={() => setSpatialAudio(!spatialAudio)}
                  className={`flex items-center gap-2 rounded-xl p-2.5 text-left text-xs font-medium transition-all ${
                    spatialAudio
                      ? 'bg-purple-500/30 text-purple-200 ring-1 ring-purple-400/40'
                      : 'bg-white/5 text-white/70 hover:bg-white/10'
                  }`}
                >
                  <Icon name="Headphones" size={16} className={spatialAudio ? 'text-purple-300' : 'text-white/50'} />
                  <div>
                    <div>Spatial Audio</div>
                    <div className="text-[10px] text-white/40">{spatialAudio ? 'Dolby Atmos' : 'Stereo'}</div>
                  </div>
                </button>

                <button
                  onClick={() => setBatterySaver(!batterySaver)}
                  className={`flex items-center gap-2 rounded-xl p-2.5 text-left text-xs font-medium transition-all ${
                    batterySaver
                      ? 'bg-emerald-500/30 text-emerald-200 ring-1 ring-emerald-400/40'
                      : 'bg-white/5 text-white/70 hover:bg-white/10'
                  }`}
                >
                  <Icon name="BatteryCharging" size={16} className={batterySaver ? 'text-emerald-300' : 'text-white/50'} />
                  <div>
                    <div>Power Mode</div>
                    <div className="text-[10px] text-white/40">{batterySaver ? 'Efficiency' : 'Balanced'}</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Date Footer */}
            <div className="mt-3 flex items-center justify-between rounded-xl bg-white/5 px-3 py-2 text-xs text-white/70">
              <span className="font-medium">{formattedDate}</span>
              <span className="text-[11px] text-sky-400 font-mono">100% Charged</span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
