'use client';

import { useMemo } from 'react';
import { getCountry } from '@/domain/countries';
import { dailyMissions, isComplete, missionProgress, type Mission } from '@/domain/game/missions';
import { todayContext } from '@/domain/game/todayView';
import { dayKey } from '@/domain/game/day';
import { cs } from '@/i18n/cs';
import { useProgress } from '@/store/StoreProvider';
import { useActivePool } from '@/quiz/useActivePool';
import { Button, Eyebrow, Panel, ProgressBar } from '@/components/ui';

function missionLabel(mission: Mission): string {
  if (mission.kind === 'continent') {
    return cs.missions.kinds.continent(cs.continents[mission.continent!]);
  }
  return cs.missions.kinds[mission.kind];
}

/** Tři úkoly na den. Splní se napříč hrami, nemusí se na ně hrát zvlášť. */
export function MissionsPanel() {
  const { progress, claimMission, setMeta } = useProgress();
  const today = dayKey(new Date());
  // V bonusové sadě území nemusí mít světadíl dost vlajek na hraní –
  // přepnutí se pak nenabízí, aby nevedlo do prázdna.
  const { region, regions } = useActivePool();

  const missions = useMemo(() => dailyMissions(today), [today]);
  const ctx = useMemo(
    () => todayContext(progress.log, progress.cards, getCountry, new Date()),
    [progress.log, progress.cards],
  );
  const claimed = progress.meta.missionsClaimed[today] ?? [];

  return (
    <Panel>
      <Eyebrow>{cs.missions.title}</Eyebrow>
      <ul className="mt-3 flex flex-col gap-3">
        {missions.map((mission) => {
          const done = isComplete(mission, ctx);
          const value = missionProgress(mission, ctx);
          const isClaimed = claimed.includes(mission.id);
          return (
            <li key={mission.id} className="flex flex-col gap-1.5">
              <div className="flex items-baseline justify-between gap-3">
                <span
                  className={`text-[0.85rem] font-bold leading-snug ${
                    isClaimed ? 'text-faint line-through' : 'text-ink'
                  }`}
                >
                  {missionLabel(mission)}
                </span>
                <span className="shrink-0 text-xs font-extrabold tabular-nums text-gold">
                  {cs.missions.reward(mission.reward)}
                </span>
              </div>
              {/*
                Mise na světadíl se nedá splnit, když se hraje jiná část
                světa – ta otázka se prostě nepoloží. Místo tiché nesplnitelné
                mise nabídneme přepnutí na jedno klepnutí.
              */}
              {!isClaimed &&
              !done &&
              mission.kind === 'continent' &&
              region !== 'all' &&
              region !== mission.continent &&
              regions.includes(mission.continent!) ? (
                <div className="glass-thin mt-0.5 flex flex-col gap-2 rounded-2xl p-3">
                  <span className="text-[0.72rem] leading-snug text-faint">
                    {cs.missions.switchRegionHint}
                  </span>
                  <Button
                    variant="secondary"
                    className="h-10 min-h-10 self-start px-4 text-xs"
                    onClick={() => void setMeta({ region: mission.continent! })}
                  >
                    {cs.missions.switchRegion}
                  </Button>
                </div>
              ) : null}
              {isClaimed ? null : done ? (
                <Button
                  className="h-10 min-h-10 self-start px-4 text-xs"
                  onClick={() => void claimMission(today, mission.id, mission.reward)}
                >
                  {cs.missions.claim}
                </Button>
              ) : (
                <>
                  <ProgressBar value={value} total={mission.target} />
                  <span className="text-[0.7rem] font-bold tabular-nums text-faint">
                    {value} / {mission.target}
                  </span>
                </>
              )}
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}
