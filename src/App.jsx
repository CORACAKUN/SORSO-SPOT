import React, { useState } from 'react';
import AuthPanel from './components/AuthPanel.jsx';

const destinations = [
  {
    municipality: 'Bulusan',
    name: 'Bulusan Lake',
    details: 'Kayaking · Nature walks · Cool climate',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/e/e5/Kayaking_at_Bulusan_Lake.jpg',
    alt: 'Green mountain lake landscape',
    large: true,
  },
  {
    municipality: 'Donsol',
    name: 'Whale Shark Interaction',
    details: 'Wildlife encounter · Best from November to June',
    image:
      'https://images.unsplash.com/photo-1540202404-b2979d19ed37?auto=format&fit=crop&w=1200&q=80',
    alt: 'Whale shark underwater',
  },
  {
    municipality: 'Matnog',
    name: 'Subic Beach',
    details: 'Pinkish sand · Island hopping · Day tours',
    image:
      'https://i0.wp.com/joansfootprints.com/wp-content/uploads/2024/08/grouphie-4-1-1024x576.jpg?resize=1024%2C576&ssl=1',
    alt: 'White sand beach and calm water',
  },
];

const activities = [
  {
    name: 'Whale shark watching',
    description:
      'Donsol boat tours with briefings, spotters, and responsible interaction rules.',
  },
  {
    name: 'Lake kayaking',
    description: 'Calm paddling and short nature trails around Bulusan Lake.',
  },
  {
    name: 'Island hopping',
    description: 'Matnog routes to beaches, coves, and snorkeling areas by local boat.',
  },
];

const stays = [
  {
    name: 'Beach Resorts',
    location: 'Sta. Magdalena',
    description:
      'Best for families, island tours, and travelers who want direct water access.',
    image:
      'https://kapampangantraveller.com/wp-content/uploads/2026/05/residencia-de-hamor-full-view-bacon-sorsogon-travel-guide-kapampangan-traveller1.jpg',
    alt: 'Beach resort with pool and ocean view in Sorsogon',
  },
  {
    name: 'City Hotels',
    location: 'Sorsogon City',
    description: 'Convenient for food, errands, terminals, and business-style travel.',
    image:
      'https://q-xx.bstatic.com/xdata/images/hotel/840x460/678051054.jpg?k=98f103129536008af5fc7e47f0c4648cacb3bb27946e77a8160d4bfc5b2db0f8&o=',
    alt: 'Modern city hotel room',
  },
  {
    name: 'Nature Stays',
    location: 'Bulusan · Irosin · Juban',
    description: 'Quiet inns and homestays near lakes, forests, farms, and mountain views.',
    image: 'https://farm2.staticflickr.com/1893/43399355725_750b9c2775_k.jpg',
    alt: 'Nature stay surrounded by greenery',
  },
];

const routes = [
  {
    title: 'From Manila',
    text: 'Overnight bus to Sorsogon City or travel via Bicol airport, then van or bus onward.',
  },
  {
    title: 'Sorsogon City to Donsol',
    text: 'Use van, jeepney, private car, or arranged tour transfer depending on schedule.',
  },
  {
    title: 'Sorsogon City to Bulusan',
    text: 'Take buses or vans toward the east coast, then local rides to the lake area.',
  },
  {
    title: 'Matnog islands',
    text: 'Travel to Matnog port, then book local boats for island hopping and beach stops.',
  },
];

const itinerary = [
  {
    day: 'Day 1 · Sorsogon City',
    text: 'Arrival, food stops, city landmarks, and overnight stay.',
  },
  {
    day: 'Day 2 · Bulusan',
    text: 'Lake kayaking, nature walk, local cafe stop, and nearby viewpoints.',
  },
  {
    day: 'Day 3 · Matnog or Donsol',
    text: 'Choose island hopping for beaches or wildlife touring in Donsol.',
  },
];

function Header({ onAuthOpen }) {
  return (
    <header className="sticky top-0 z-10 flex flex-wrap items-start justify-between gap-4 border-b border-slate-200/80 bg-paper/90 px-4 py-3 backdrop-blur-xl sm:px-6 lg:flex-nowrap lg:items-center lg:px-16 lg:py-4">
      <a className="flex items-center gap-3 font-extrabold" href="#" aria-label="Sorso Spot home">
        <span className="grid size-9 place-items-center rounded-lg bg-sea text-sm font-black text-white">
          SS
        </span>
        <span>Sorso Spot</span>
      </a>

      <nav
        className="order-3 flex w-full gap-4 overflow-x-auto whitespace-nowrap pb-1 text-sm text-slate-600 lg:order-none lg:w-auto lg:gap-8 lg:pb-0"
        aria-label="Main navigation"
      >
        <a className="hover:text-ink" href="#spots">
          Tourist Spots
        </a>
        <a className="hover:text-ink" href="#adventure">
          Sports
        </a>
        <a className="hover:text-ink" href="#stay">
          Stay
        </a>
        <a className="hover:text-ink" href="#transport">
          Transport
        </a>
      </nav>

      <div className="flex gap-2">
        <button
          className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-extrabold text-ink"
          onClick={() => onAuthOpen('sign-in')}
          type="button"
        >
          Sign in
        </button>
        <button
          className="hidden rounded-lg bg-forest px-4 py-3 text-sm font-extrabold text-white sm:inline-flex"
          onClick={() => onAuthOpen('sign-up')}
          type="button"
        >
          Sign up
        </button>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative flex min-h-[calc(100svh-101px)] flex-col justify-center overflow-hidden px-4 py-6 text-white sm:min-h-[calc(100svh-118px)] lg:min-h-[calc(100svh-73px)] lg:px-16 lg:py-12">
      <div
        className="absolute inset-0 -z-20 bg-cover bg-center"
        style={{
          backgroundImage:
            'linear-gradient(90deg, rgba(9,30,29,.86), rgba(9,30,29,.44) 54%, rgba(9,30,29,.16)), url("https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=1800&q=85")',
        }}
        role="img"
        aria-label="Tropical coastline and mountains inspired by Sorsogon"
      />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-44 bg-gradient-to-b from-transparent to-paper" />

      <div className="max-w-3xl">
        <p className="mb-2 text-xs font-black uppercase text-sun">Explore Sorsogon, Philippines</p>
        <h1 className="mb-4 max-w-4xl text-[clamp(2.15rem,11vw,3.2rem)] font-black leading-none sm:text-[clamp(3rem,7.4vw,6rem)]">
          Your local guide to beaches, adventures, stays, and routes.
        </h1>
        <p className="max-w-2xl text-[0.95rem] leading-relaxed text-white/90 sm:text-lg">
          Discover Sorsogon's whale shark encounters, quiet beaches, mountain lakes, heritage
          stops, local stays, and practical transportation routes in one guide.
        </p>
        <div className="mt-5 flex flex-wrap gap-3 sm:mt-8">
          <a
            className="inline-flex min-h-11 flex-1 items-center justify-center rounded-lg bg-sun px-4 py-3 font-extrabold text-ink sm:flex-none"
            href="#spots"
          >
            Browse places
          </a>
          <a
            className="inline-flex min-h-11 flex-1 items-center justify-center rounded-lg border border-white/45 bg-white/10 px-4 py-3 font-extrabold text-white sm:flex-none"
            href="#transport"
          >
            How to get around
          </a>
        </div>
      </div>

      <form
        className="mt-6 grid w-full max-w-5xl grid-cols-2 gap-2 rounded-lg border border-white/70 bg-white/95 p-3 text-ink shadow-travel sm:mt-8 sm:gap-4 sm:p-4 lg:mt-14 lg:grid-cols-4"
        aria-label="Trip finder"
      >
        {[
          ['Destination', ['Donsol', 'Bulusan', 'Matnog', 'Sorsogon City']],
          ['Interest', ['Nature', 'Adventure', 'Beach', 'Culture']],
          ['Trip Length', ['1 day', '2 days', '3 days', '5 days']],
        ].map(([label, options]) => (
          <label className="grid gap-1" key={label}>
            <span className="text-xs font-extrabold text-slate-500">{label}</span>
            <select className="min-h-11 rounded-lg border border-slate-200 bg-mist px-3 text-sm text-ink">
              {options.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </label>
        ))}
        <button
          className="min-h-11 self-end rounded-lg bg-coral px-3 text-sm font-extrabold text-white"
          type="button"
        >
          Find ideas
        </button>
      </form>
    </section>
  );
}

function QuickLinks() {
  const links = [
    ['Tourist Spots', 'Beaches, lakes, parks', '#spots'],
    ['Sports & Adventure', 'Whale sharks, hikes, surf', '#adventure'],
    ['Accommodation', 'Hotels, resorts, homestays', '#stay'],
    ['Transportation', 'Routes, vans, boats', '#transport'],
  ];

  return (
    <section
      className="mx-4 grid overflow-hidden rounded-lg border border-slate-200 bg-slate-200 sm:grid-cols-2 lg:mx-16 lg:-mt-4 lg:grid-cols-4"
      aria-label="Popular categories"
    >
      {links.map(([label, text, href]) => (
        <a className="p-5 odd:bg-white even:bg-white hover:bg-mist" href={href} key={label}>
          <span className="mb-1 block text-xs font-black uppercase text-sea">{label}</span>
          <strong className="block text-base sm:text-lg">{text}</strong>
        </a>
      ))}
    </section>
  );
}

function Destinations() {
  return (
    <section className="px-4 py-16 sm:py-20 lg:px-16 lg:py-28" id="spots">
      <div className="mb-7 max-w-3xl">
        <p className="mb-3 text-xs font-black uppercase text-sun">Featured places</p>
        <h2 className="text-[clamp(2rem,4vw,3.5rem)] font-black leading-none">
          Start with Sorsogon's signature stops.
        </h2>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_.8fr]">
        {destinations.map((destination) => (
          <article
            className={`group relative min-h-80 overflow-hidden rounded-lg bg-ink ${
              destination.large ? 'lg:row-span-2 lg:min-h-[638px]' : 'lg:min-h-[310px]'
            }`}
            key={destination.name}
          >
            <img
              className="h-full object-cover opacity-80 transition duration-300 group-hover:scale-105"
              src={destination.image}
              alt={destination.alt}
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-b from-transparent to-ink/90 p-6 text-white">
              <p className="mb-1 font-black text-sun">{destination.municipality}</p>
              <h3 className="mb-2 text-xl font-black">{destination.name}</h3>
              <span className="text-white/80">{destination.details}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function Adventure() {
  return (
    <section
      className="grid gap-10 px-4 py-16 sm:py-20 lg:grid-cols-[.9fr_1.1fr] lg:gap-20 lg:px-16 lg:py-28"
      id="adventure"
    >
      <div>
        <p className="mb-3 text-xs font-black uppercase text-sun">Sports & adventure</p>
        <h2 className="mb-4 text-[clamp(2rem,4vw,3.5rem)] font-black leading-none">
          Build a trip around movement, water, and nature.
        </h2>
        <p className="max-w-xl text-lg text-slate-600">
          Group activities by difficulty and season so travelers can pick the right experience
          before booking. Add safety notes, guide contacts, and expected costs on the full version.
        </p>
      </div>

      <div className="grid gap-4">
        {activities.map((activity, index) => (
          <article
            className="grid grid-cols-[54px_1fr] gap-4 rounded-lg border border-slate-200 bg-white p-5"
            key={activity.name}
          >
            <span className="grid size-11 place-items-center rounded-lg bg-sea font-black text-white">
              {String(index + 1).padStart(2, '0')}
            </span>
            <div>
              <h3 className="mb-2 text-xl font-black">{activity.name}</h3>
              <p className="text-slate-600">{activity.description}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function Stay() {
  return (
    <section className="bg-mist px-4 py-16 sm:py-20 lg:px-16 lg:py-28" id="stay">
      <div className="mb-7 max-w-3xl">
        <p className="mb-3 text-xs font-black uppercase text-sun">Where to stay</p>
        <h2 className="text-[clamp(2rem,4vw,3.5rem)] font-black leading-none">
          Accommodation choices by travel style.
        </h2>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {stays.map((stay) => (
          <article className="rounded-lg border border-slate-200 bg-white p-5" key={stay.name}>
            <img className="mb-5 aspect-[4/3] rounded-lg object-cover" src={stay.image} alt={stay.alt} />
            <h3 className="mb-2 text-xl font-black">{stay.name}</h3>
            <p className="text-slate-600">{stay.description}</p>
            <span className="mt-6 inline-flex font-black text-forest">{stay.location}</span>
          </article>
        ))}
      </div>
    </section>
  );
}

function Transport() {
  return (
    <section className="px-4 py-16 sm:py-20 lg:px-16 lg:py-28" id="transport">
      <div className="mb-7 max-w-3xl">
        <p className="mb-3 text-xs font-black uppercase text-sun">Transportation</p>
        <h2 className="text-[clamp(2rem,4vw,3.5rem)] font-black leading-none">
          Make routes clear before visitors arrive.
        </h2>
      </div>

      <div className="grid border-l border-t border-slate-200 sm:grid-cols-2 lg:grid-cols-4">
        {routes.map((route) => (
          <article className="min-h-52 border-b border-r border-slate-200 p-6" key={route.title}>
            <strong className="mb-3 block text-lg text-sea">{route.title}</strong>
            <p className="text-slate-600">{route.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function Itinerary() {
  return (
    <section
      className="grid gap-8 bg-ink px-4 py-16 text-white sm:py-20 lg:grid-cols-[.8fr_1.2fr] lg:gap-16 lg:px-16 lg:py-28"
      id="itinerary"
    >
      <div>
        <p className="mb-3 text-xs font-black uppercase text-sun">Sample itinerary</p>
        <h2 className="text-[clamp(2rem,4vw,3.5rem)] font-black leading-none">
          3-day Sorsogon starter route
        </h2>
      </div>

      <ol className="grid gap-4">
        {itinerary.map((item) => (
          <li className="grid gap-1 rounded-lg border border-white/15 bg-white/10 p-5" key={item.day}>
            <strong>{item.day}</strong>
            <span className="text-white/75">{item.text}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

function Footer() {
  return (
    <footer className="flex flex-col justify-between gap-5 border-t border-slate-200 bg-white px-4 py-8 sm:flex-row sm:items-center lg:px-16">
      <div>
        <strong>Sorso Spot</strong>
        <p className="mt-1 max-w-2xl text-slate-600">
          A sample tourism landing page for Sorsogon attractions, activities, stays, and routes.
        </p>
      </div>
      <a className="font-black text-sea" href="#">
        Back to top
      </a>
    </footer>
  );
}

export default function App() {
  const [authModal, setAuthModal] = useState({
    isOpen: false,
    initialView: 'sign-in',
  });

  function openAuthModal(initialView) {
    setAuthModal({ isOpen: true, initialView });
  }

  function closeAuthModal() {
    setAuthModal((current) => ({ ...current, isOpen: false }));
  }

  return (
    <>
      <Header onAuthOpen={openAuthModal} />
      <main>
        <Hero />
        <QuickLinks />
        <Destinations />
        <Adventure />
        <Stay />
        <Transport />
        <Itinerary />
      </main>
      <Footer />
      <AuthPanel
        initialView={authModal.initialView}
        isOpen={authModal.isOpen}
        onClose={closeAuthModal}
      />
    </>
  );
}
