interface Props {
  className?: string;
}

export default function LogoMark({ className = "h-10 w-10" }: Props) {
  return (
    <svg className={className} viewBox="0 0 180 150" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="logoBubble" x1="31" y1="26" x2="139" y2="137" gradientUnits="userSpaceOnUse">
          <stop stopColor="#22f4ff" />
          <stop offset="0.48" stopColor="#1585ff" />
          <stop offset="1" stopColor="#0437d8" />
        </linearGradient>
        <linearGradient id="logoBubbleLight" x1="46" y1="32" x2="104" y2="96" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7efbff" stopOpacity="0.95" />
          <stop offset="1" stopColor="#0a62ef" stopOpacity="0.25" />
        </linearGradient>
        <linearGradient id="logoGem" x1="139" y1="16" x2="151" y2="75" gradientUnits="userSpaceOnUse">
          <stop stopColor="#b9fbff" />
          <stop offset="0.45" stopColor="#26dfff" />
          <stop offset="1" stopColor="#0b55ff" />
        </linearGradient>
        <filter id="logoGlow" x="-20" y="-20" width="220" height="190" filterUnits="userSpaceOnUse">
          <feGaussianBlur stdDeviation="8" result="blur" />
          <feColorMatrix in="blur" type="matrix" values="0 0 0 0 0.03 0 0 0 0 0.55 0 0 0 0 1 0 0 0 0.78 0" />
          <feBlend in="SourceGraphic" />
        </filter>
      </defs>

      <g filter="url(#logoGlow)">
        <path
          d="M29.3 42.6C42.2 22.7 73.8 15 105.9 22.4c37.1 8.5 60.5 33.6 52.3 56.1-7.7 21.2-41.1 32.1-76.1 25.7l-42.7 26.1c-3.5 2.1-7.9-.9-7.1-4.9l6.7-32.8C19.8 78.7 15.9 63.3 29.3 42.6Z"
          fill="url(#logoBubble)"
        />
        <path
          d="M33.7 43.1C46.2 28.8 73.3 23 101 29.1c31.8 7 53.3 26.9 48.1 44.4-5.3 17.9-35.8 27.4-68.2 21.1l-34.7 20.2 5.9-27.3C34 77.6 22.4 56.1 33.7 43.1Z"
          fill="url(#logoBubbleLight)"
          opacity="0.78"
        />
        <path
          d="M34.5 41.5C48.8 22.9 80.9 18.2 111.2 28"
          stroke="#bdfaff"
          strokeWidth="4.5"
          strokeLinecap="round"
          opacity="0.9"
        />
        <path
          d="M44.7 56.6c0-11.4 9.2-20.6 20.6-20.6h42.1c11.4 0 20.6 9.2 20.6 20.6v13.5c0 11.4-9.2 20.6-20.6 20.6H73.2l-21.9 15.2 4.2-18.9c-6.5-3.5-10.8-10.3-10.8-18.1V56.6Z"
          fill="#0d86ff"
          opacity="0.55"
          stroke="#9af7ff"
          strokeWidth="3.5"
        />
        <path
          d="M81.8 67.2c0-10.9 8.8-19.7 19.7-19.7h38.2c10.9 0 19.7 8.8 19.7 19.7v12c0 10.9-8.8 19.7-19.7 19.7h-11.8l3.3 19-25.8-19H101.5c-10.9 0-19.7-8.8-19.7-19.7v-12Z"
          fill="#0a6df7"
          stroke="#89f7ff"
          strokeWidth="3.4"
        />
        <circle cx="67.5" cy="63.5" r="5.4" fill="#d1fbff" />
        <circle cx="80.6" cy="63.5" r="5.4" fill="#d1fbff" />
        <circle cx="106.2" cy="73.8" r="5.6" fill="#d1fbff" />
        <circle cx="121" cy="73.8" r="5.6" fill="#d1fbff" />
        <circle cx="135.8" cy="73.8" r="5.6" fill="#d1fbff" />

        <g transform="translate(125 9) rotate(12)">
          <path d="M8 18 21 5l15 4 12 17-28 34L8 18Z" fill="url(#logoGem)" />
          <path d="M21 5h15l4 21H15L21 5Z" fill="#74f8ff" opacity="0.9" />
          <path d="M15 26h25L20 60 15 26Z" fill="#1269ff" />
          <path d="M8 18 21 5l-6 21-7-8Z" fill="#2bddff" />
          <path d="M48 26 36 9l4 17h8Z" fill="#0d55ff" />
          <path d="M18 9h16" stroke="white" strokeWidth="2.4" strokeLinecap="round" opacity="0.72" />
        </g>

        <g transform="translate(146 48) rotate(10) scale(.78)">
          <path d="M8 18 21 5l15 4 12 17-28 34L8 18Z" fill="url(#logoGem)" />
          <path d="M21 5h15l4 21H15L21 5Z" fill="#8dfaff" opacity="0.9" />
          <path d="M15 26h25L20 60 15 26Z" fill="#0f64ff" />
          <path d="M8 18 21 5l-6 21-7-8Z" fill="#36e8ff" />
          <path d="M48 26 36 9l4 17h8Z" fill="#0a4be8" />
        </g>

        <path d="M153 23h.1" stroke="#eaffff" strokeWidth="5" strokeLinecap="round" />
        <path d="M153 13v20M143 23h20" stroke="#eaffff" strokeWidth="1.7" strokeLinecap="round" opacity="0.9" />
      </g>
    </svg>
  );
}
