import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  Utensils,
  ChefHat,
  Bike,
  ShieldCheck,
  ArrowRight,
  MapPin,
} from "lucide-react";
import { ROLES } from "../lib/roles.js";
const icons = {
  customer: Utensils,
  restaurant: ChefHat,
  delivery: Bike,
  admin: ShieldCheck,
};
const accents = {
  customer: "bg-teal/10 text-teal",
  restaurant: "bg-chili/10 text-chili",
  delivery: "bg-turmeric/20 text-turmeric-dark",
  admin: "bg-ink/10 text-ink",
};
export default function Landing() {
  return (
    <main className="max-w-6xl mx-auto px-5 sm:px-8 pb-12">
      <section className="grid lg:grid-cols-[1.15fr_1fr] gap-10 lg:gap-16 items-center pt-12 sm:pt-20 pb-12 sm:pb-16">
        <div>
          <p className="flex items-center gap-2 text-xs font-mono uppercase tracking-[.18em] text-teal font-bold mb-6">
            <span className="h-2 w-2 rounded-full bg-teal" /> A place for every
            appetite
          </p>
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display text-5xl sm:text-6xl lg:text-7xl leading-[1.04] font-bold tracking-tight text-ink"
          >
            Good food.
            <br />
            Great people.
            <br />
            <span className="text-teal">One Foodie.</span>
          </motion.h1>
          <p className="mt-6 text-ink/60 text-base sm:text-lg leading-relaxed max-w-md">
            Whether you’re craving it, cooking it or bringing it to the
            door—there’s a place for you here.
          </p>
          <a
            href="#choose-role"
            className="mt-8 inline-flex items-center gap-3 bg-teal text-paper px-6 py-3.5 rounded-full font-semibold hover:bg-teal-dark transition-colors"
          >
            Find your place <ArrowRight size={18} />
          </a>
          <Link
            to="/menu"
            className="inline-flex ml-5 mt-5 text-sm font-semibold text-ink/65 underline underline-offset-4"
          >
            Just explore the menu
          </Link>
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
          className="relative mx-auto w-full max-w-md"
        >
          <div className="absolute inset-5 bg-turmeric/25 rounded-full blur-3xl" />
          <div className="relative rounded-[2rem] bg-card p-3 border border-ink/10 shadow-xl rotate-2">
            <img
              className="w-full aspect-[4/3] object-cover rounded-[1.5rem]"
              src="https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=800&q=80"
              alt="Fresh paneer tikka served with vegetables"
            />
            <div className="flex justify-between items-center px-3 py-4">
              <div>
                <p className="font-display font-bold text-xl">
                  Made with a little love.
                </p>
                <p className="text-xs text-ink/50 mt-1">
                  From a kitchen near you.
                </p>
              </div>
              <span className="rounded-full bg-teal/10 p-3 text-teal">
                <ChefHat size={24} />
              </span>
            </div>
          </div>
          <div className="relative -mt-3 ml-auto mr-2 w-fit bg-ink text-paper rounded-2xl px-5 py-3 shadow-lg -rotate-3 flex gap-3 items-center">
            <Bike className="text-turmeric" />
            <div>
              <p className="text-sm font-bold">A whole community, connected.</p>
              <p className="text-xs text-paper/60">
                Kitchen → rider → your doorstep
              </p>
            </div>
          </div>
        </motion.div>
      </section>
      <section
        id="choose-role"
        className="scroll-mt-24 border-t border-ink/10 pt-9"
      >
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-6">
          <div>
            <p className="text-xs text-teal font-mono font-bold uppercase tracking-widest mb-2">
              YOUR JOURNEY STARTS HERE
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold">
              How will you Foodie?
            </h2>
          </div>
          <p className="text-sm text-ink/50">
            Choose your space. We’ll take you to sign in.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(ROLES).map(([role, info], i) => {
            const Icon = icons[role];
            return (
              <motion.div
                key={role}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  to={"/login/" + role}
                  className="group h-full block rounded-3xl bg-card border border-ink/10 p-6 hover:border-teal/50 hover:-translate-y-1 hover:shadow-lg transition-all"
                >
                  <div className="flex justify-between items-center mb-6">
                    <span className={"rounded-2xl p-3 " + accents[role]}>
                      <Icon size={25} />
                    </span>
                    <ArrowUpRight
                      size={20}
                      className="text-ink/30 group-hover:text-teal"
                    />
                  </div>
                  <h3 className="font-display font-bold text-xl mb-3">
                    {info.title}
                  </h3>
                  <p className="text-sm text-ink/60 leading-relaxed min-h-[100px]">
                    {info.description}
                  </p>
                  <p className="text-xs font-bold text-teal mt-5 flex items-center gap-2">
                    {info.action}
                    <ArrowRight size={14} />
                  </p>
                </Link>
              </motion.div>
            );
          })}
        </div>
        <p className="text-xs text-ink/45 mt-5">
          New here? Customers can join at sign-in. Partner and administrator
          spaces are for approved accounts.
        </p>
      </section>
      <footer className="mt-12 pt-6 border-t border-ink/10 flex flex-wrap gap-3 justify-between text-xs text-ink/40">
        <span>Foodie. Good food, shared.</span>
        <span className="flex gap-1 items-center">
          <MapPin size={13} /> Local kitchens. Real connections.
        </span>
      </footer>
    </main>
  );
}
