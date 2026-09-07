import { forwardRef, useLayoutEffect, useState, useEffect } from 'react';
import {
  usePageBuilderStore,
  COUNTDOWN_DEFAULTS,
} from '../stores/pageBuilderStore';

interface CountdownProps {
  componentId: string;
}

export const Countdown = forwardRef<HTMLElement, CountdownProps>(
  (props, ref) => {
    const id = props.componentId ?? 'preview';
    const s = usePageBuilderStore(
      (state) => state.countdown[id] ?? COUNTDOWN_DEFAULTS,
    );
    const [isBuilder, setIsBuilder] = useState(true);

    const [timeLeft, setTimeLeft] = useState({
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
    });

    useEffect(() => {
      const el = document.getElementById(id);
      if (el) setIsBuilder(true);
    }, [id]);

    useLayoutEffect(() => {
      const el = document.getElementById(id);
      if (!el) return;
      const saved = el.getAttribute('data-pb-settings');
      if (saved) {
        try {
          usePageBuilderStore.getState().setCountdown(id, JSON.parse(saved));
        } catch (_e) {
          /* ignore */
        }
      }
    }, [id]);

    useLayoutEffect(() => {
      const el = document.getElementById(id);
      if (el) el.setAttribute('data-pb-settings', JSON.stringify(s));
    }, [id, s]);

    // Timer logic
    useEffect(() => {
      const calculateTimeLeft = () => {
        const difference = +new Date(s.targetDate) - +new Date();
        if (difference > 0) {
          setTimeLeft({
            days: Math.floor(difference / (1000 * 60 * 60 * 24)),
            hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
            minutes: Math.floor((difference / 1000 / 60) % 60),
            seconds: Math.floor((difference / 1000) % 60),
          });
        } else {
          setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        }
      };

      calculateTimeLeft();
      const timer = setInterval(calculateTimeLeft, 1000);
      return () => clearInterval(timer);
    }, [s.targetDate]);

    if (!s) return null;

    const {
      labelDays,
      labelHours,
      labelMinutes,
      labelSeconds,
      backgroundColor,
      textColor,
      numberColor,
    } = s;

    return (
      <section
        ref={ref}
        id={id}
        data-pb-settings={JSON.stringify(s)}
        style={{
          width: '100%',
          backgroundColor,
          padding: '48px 24px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        <div
          style={{
            maxWidth: '800px',
            margin: '0 auto',
            pointerEvents: isBuilder ? 'none' : 'auto',
            display: 'flex',
            justifyContent: 'center',
            gap: '24px',
            flexWrap: 'wrap',
          }}
        >
          {[
            { label: labelDays, value: timeLeft.days },
            { label: labelHours, value: timeLeft.hours },
            { label: labelMinutes, value: timeLeft.minutes },
            { label: labelSeconds, value: timeLeft.seconds },
          ].map((item, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                minWidth: '100px',
              }}
            >
              <div
                style={{
                  fontSize: '3rem',
                  fontWeight: 700,
                  color: numberColor,
                  lineHeight: 1,
                  marginBottom: '8px',
                }}
              >
                {item.value.toString().padStart(2, '0')}
              </div>
              <div
                style={{
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: textColor,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                }}
              >
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  },
);

Countdown.displayName = 'Countdown';
