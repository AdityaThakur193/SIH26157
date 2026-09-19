import React, { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

export const AnimatedCounter = ({ value }: { value: number }) => {
  const numberRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (value === undefined || value === null) return;
    const obj = { val: 0 };
    gsap.to(obj, {
      val: value,
      duration: 1.5,
      ease: 'power3.out',
      onUpdate: () => {
        if (numberRef.current) {
          numberRef.current.innerText = Math.round(obj.val).toLocaleString();
        }
      }
    });
  }, [value]);

  return <span ref={numberRef}>0</span>;
};
