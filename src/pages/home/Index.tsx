import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ShieldCheck, ArrowRight, CheckCircle, BarChart3, Users, Globe, Award,
  Zap, Network, Settings2, TrendingUp, Play
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ROUTE_PATHS } from "@/lib/index";
import { MODULES } from "@/data/index";

const CAPABILITIES = [
  { icon: Zap, title: "Agile Dissemination", desc: "Instantly communicate updates, procedures and compliance changes to all staff through their personalised dashboards." },
  { icon: Settings2, title: "Streamlined Compliance", desc: "Centralise all compliance requirements, deadlines, and evidence in one integrated cloud-based platform." },
  { icon: Network, title: "Networked Organisation", desc: "Connect every department, site, and function in a single unified management ecosystem." },
  { icon: Globe, title: "Supply Chain Integration", desc: "Extend compliance requirements seamlessly to your suppliers with automated reminders and SQA scoring." },
  { icon: CheckCircle, title: "Standardised Work", desc: "Define, distribute, and enforce standardised operating procedures with full version control." },
  { icon: TrendingUp, title: "Management by Exception", desc: "Surface only the issues that require attention so managers can focus on what matters most." },
  { icon: Users, title: "Staff Empowerment", desc: "Give every employee a personalised Work Summary page with clear responsibilities, deadlines, and escalation paths." },
  { icon: BarChart3, title: "Business Scalability", desc: "Modular architecture means the platform grows with your organisation, adding capability when you need it." },
];

const STATS = [
  { value: "18+", label: "Integrated Modules" },
  { value: "ISO 9001", label: "Foundation Standard" },
  { value: "OHS Act", label: "Fully Compliant" },
  { value: "Cloud", label: "Based & Secure" },
];

const STANDARDS = [
  "FSSC 22000", "ISO 9001:2015", "BRC Global", "NOSA/OHSAS 18001", "OHS Act 85/93", "HACCP"
];

export default function HomePage() {
  const categoryGroups = [
    { label: "General", modules: MODULES.filter(m => m.category === "general") },
    { label: "Technical", modules: MODULES.filter(m => m.category === "technical") },
    { label: "Operations", modules: MODULES.filter(m => m.category === "operations") },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden bg-primary">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(circle at 25% 50%, white 0%, transparent 50%), radial-gradient(circle at 75% 20%, white 0%, transparent 40%)" }} />
        </div>
        <div className="relative max-w-6xl mx-auto px-6 py-20 lg:py-28">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <Badge className="mb-6 bg-white/20 text-[#0D2240] border-white/30 hover:bg-white/25 text-sm px-4 py-1.5">
              Cloud-Based Integrated Management System
            </Badge>
            <h1 className="text-4xl lg:text-6xl font-bold text-[#0D2240] mb-6 leading-tight max-w-4xl">
              Compliance Software for the{" "}
              <span className="text-accent">Food Industry</span>
            </h1>
            <p className="text-lg text-[#0D2240]/80 mb-10 max-w-2xl leading-relaxed">
              A powerful, cloud-based IMS designed with the specific needs of food manufacturing in mind.
              Eliminate oversight, establish traceability, allocate responsibility, and streamline operational processes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90 font-semibold shadow-lg">
                <Link to={ROUTE_PATHS.DASHBOARD}>
                  Go to Dashboard <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/40 text-[#0D2240] hover:bg-white/10">
                <Link to={ROUTE_PATHS.MODULES}>
                  Explore Modules
                </Link>
              </Button>
            </div>
          </motion.div>

          {/* Stats Row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mt-16 grid grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {STATS.map(stat => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold text-[#0D2240]">{stat.value}</div>
                <div className="text-sm text-[#0D2240]/60 mt-1">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Standards Banner */}
      <section className="bg-muted border-y border-border py-5">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-wrap items-center justify-center gap-3 lg:gap-6">
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mr-2">Supported Standards:</span>
            {STANDARDS.map(s => (
              <div key={s} className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                <Award className="h-3.5 w-3.5 text-accent" />
                {s}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Capabilities */}
      <section className="py-20 px-6 max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-foreground mb-4">What CyberSecureIMS Facilitates</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Eight core capabilities that transform how your organisation manages compliance.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {CAPABILITIES.map((cap, i) => (
            <motion.div
              key={cap.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className="p-6 rounded-xl border border-border bg-card hover:shadow-md transition-shadow"
            >
              <div className="p-2.5 rounded-lg bg-accent/10 w-fit mb-4">
                <cap.icon className="h-5 w-5 text-accent" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">{cap.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{cap.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Modules Overview */}
      <section className="py-20 bg-muted/40 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-foreground mb-4">18 Integrated Modules</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Quickly customised to your specific requirements. Each module works independently or as part of the full platform.
            </p>
          </div>
          {categoryGroups.map(group => (
            <div key={group.label} className="mb-10">
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4 px-1">{group.label}</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {group.modules.map(mod => {
                  const colors = {
                    compliant: "border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50/50",
                    warning: "border-amber-200 hover:border-amber-400 hover:bg-amber-50/50",
                    overdue: "border-red-200 hover:border-red-400 hover:bg-red-50/50",
                    pending: "border-blue-200 hover:border-blue-400 hover:bg-blue-50/50",
                  }[mod.status];
                  return (
                    <Link
                      key={mod.id}
                      to={mod.path}
                      className={`bg-card border rounded-lg p-4 text-center hover:shadow-md transition-all ${colors}`}
                    >
                      <div className="text-sm font-medium text-foreground leading-tight">{mod.name}</div>
                      <div className="text-xs text-muted-foreground mt-1">{mod.completionRate}% compliant</div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
          <div className="text-center mt-8">
            <Button asChild size="lg" className="bg-primary text-primary-foreground">
              <Link to={ROUTE_PATHS.MODULES}>
                View All Modules <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="p-3.5 rounded-xl bg-primary/10 w-fit mx-auto mb-6">
            <ShieldCheck className="h-10 w-10 text-primary" />
          </div>
          <h2 className="text-3xl font-bold text-foreground mb-4">Ready to Simplify Compliance?</h2>
          <p className="text-muted-foreground mb-8 text-lg">
            Supported by a team of administrators, business analysts, and developers well-versed in quality,
            food manufacturing, and health & safety.
          </p>
          <Button asChild size="lg" className="bg-primary text-primary-foreground">
            <Link to={ROUTE_PATHS.DASHBOARD}>
              Access Your Dashboard <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
