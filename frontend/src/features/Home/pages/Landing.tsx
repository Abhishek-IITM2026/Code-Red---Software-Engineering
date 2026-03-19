import { Link } from "react-router-dom";
import { FiBookOpen, FiAward, FiUsers, FiBarChart2, FiCheckCircle, FiArrowRight, FiStar, FiClock, FiShield, FiTrendingUp } from "react-icons/fi";
import { Button, Card } from "../../../components/common";

const Landing = () => {
  const features = [
    {
      icon: FiBookOpen,
      title: "Smart Attendance",
      description: "Real-time attendance tracking with automated notifications and detailed reports.",
      color: "bg-blue-500"
    },
    {
      icon: FiAward,
      title: "Online Assessments",
      description: "Create and manage exams, quizzes, and assignments with automatic grading.",
      color: "bg-purple-500"
    },
    {
      icon: FiBarChart2,
      title: "Analytics Dashboard",
      description: "Comprehensive performance analytics and insights for students and educators.",
      color: "bg-green-500"
    },
    {
      icon: FiUsers,
      title: "Parent Portal",
      description: "Keep parents informed with real-time updates on progress and attendance.",
      color: "bg-amber-500"
    },
    {
      icon: FiClock,
      title: "Schedule Management",
      description: "Smart timetabling with conflict detection and room allocation.",
      color: "bg-red-500"
    },
    {
      icon: FiShield,
      title: "Secure & Reliable",
      description: "Enterprise-grade security with role-based access control.",
      color: "bg-cyan-500"
    }
  ];

  const stats = [
    { value: "10,000+", label: "Students" },
    { value: "500+", label: "Teachers" },
    { value: "50+", label: "Institutions" },
    { value: "99.9%", label: "Uptime" }
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Parent",
      content: "CodeRed has made it so easy to track my child's progress. I love getting real-time updates!",
      avatar: "S"
    },
    {
      name: "Michael Chen",
      role: "Teacher",
      content: "The attendance system saves hours of time every week. Highly recommend for any institute.",
      avatar: "M"
    },
    {
      name: "Emily Davis",
      role: "Principal",
      content: "We've seen a 40% improvement in parent engagement since implementing CodeRed.",
      avatar: "E"
    }
  ];

  const pricingPlans = [
    {
      name: "Starter",
      price: "$99",
      period: "/month",
      description: "Perfect for small institutes",
      features: ["Up to 100 students", "Basic attendance", "Email support", "5 GB storage"],
      highlighted: false
    },
    {
      name: "Professional",
      price: "$249",
      period: "/month",
      description: "For growing institutions",
      features: ["Up to 500 students", "Advanced analytics", "Priority support", "25 GB storage", "Parent portal"],
      highlighted: true
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "",
      description: "For large organizations",
      features: ["Unlimited students", "Custom integrations", "24/7 dedicated support", "Unlimited storage", "Custom branding"],
      highlighted: false
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-20 right-0 w-[600px] h-[600px] bg-[var(--primary)]/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[var(--accent)]/10 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Hero Content */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] text-sm font-medium mb-6">
                <FiStar className="w-4 h-4" />
                Trusted by 50+ Institutions Worldwide
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[var(--text)] leading-tight">
                Modern Coaching
                <span className="text-[var(--primary)] block">Management System</span>
              </h1>
              <p className="mt-6 text-lg text-[var(--text-secondary)] max-w-xl mx-auto lg:mx-0">
                Streamline your institute's operations with our comprehensive solution for attendance, assessments, performance tracking, and parent communication.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link to="/auth/register">
                  <Button variant="primary" size="large" icon={<FiArrowRight className="w-5 h-5" />}>
                    Start Free Trial
                  </Button>
                </Link>
                <Link to="/auth/login">
                  <Button variant="outline" size="large">
                    View Demo
                  </Button>
                </Link>
              </div>
              <div className="mt-8 flex items-center gap-6 justify-center lg:justify-start text-sm text-[var(--text-secondary)]">
                <div className="flex items-center gap-2">
                  <FiCheckCircle className="w-5 h-5 text-green-500" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <FiCheckCircle className="w-5 h-5 text-green-500" />
                  <span>14-day free trial</span>
                </div>
              </div>
            </div>

            {/* Hero Image/Illustration */}
            <div className="relative hidden lg:block">
              <div className="relative bg-[var(--card-bg)] rounded-3xl shadow-2xl p-6 border border-[var(--border)]">
                {/* Dashboard Preview */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                </div>
                <div className="space-y-4">
                  <div className="h-8 bg-[var(--secondary)] rounded-lg w-3/4"></div>
                  <div className="grid grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-24 bg-[var(--secondary)] rounded-xl"></div>
                    ))}
                  </div>
                  <div className="h-32 bg-[var(--secondary)] rounded-xl"></div>
                </div>
              </div>
              {/* Floating Elements */}
              <div className="absolute -top-6 -right-6 bg-[var(--card-bg)] rounded-xl p-4 shadow-xl border border-[var(--border)]">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-100 text-green-600">
                    <FiTrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm text-[var(--text-secondary)]">Attendance</p>
                    <p className="font-bold text-[var(--text)]">98%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-[var(--secondary)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <p className="text-3xl md:text-4xl font-bold text-[var(--primary)]">{stat.value}</p>
                <p className="text-[var(--text-secondary)] mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[var(--text)]">
              Everything You Need
            </h2>
            <p className="mt-4 text-lg text-[var(--text-secondary)] max-w-2xl mx-auto">
              A complete suite of tools designed to simplify institute management and enhance learning outcomes.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="!p-6" hover={true}>
                <div className={`inline-flex p-3 rounded-xl ${feature.color} text-white mb-4`}>
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold text-[var(--text)] mb-2">{feature.title}</h3>
                <p className="text-[var(--text-secondary)]">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-[var(--secondary)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[var(--text)]">
              What Our Users Say
            </h2>
            <p className="mt-4 text-lg text-[var(--text-secondary)]">
              Join thousands of satisfied institutions worldwide
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="!p-6" hover={true}>
                <div className="flex items-center gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <FiStar key={star} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-[var(--text-secondary)] mb-6">"{testimonial.content}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[var(--primary)] flex items-center justify-center text-white font-semibold">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-[var(--text)]">{testimonial.name}</p>
                    <p className="text-sm text-[var(--text-secondary)]">{testimonial.role}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[var(--text)]">
              Simple, Transparent Pricing
            </h2>
            <p className="mt-4 text-lg text-[var(--text-secondary)]">
              Choose the plan that fits your needs
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <Card 
                key={index} 
                className={`!p-6 ${plan.highlighted ? 'ring-2 ring-[var(--primary)]' : ''}`}
                hover={true}
              >
                {plan.highlighted && (
                  <span className="inline-block px-3 py-1 rounded-full bg-[var(--primary)] text-white text-xs font-medium mb-4">
                    Most Popular
                  </span>
                )}
                <h3 className="text-xl font-semibold text-[var(--text)]">{plan.name}</h3>
                <div className="mt-4 flex items-baseline">
                  <span className="text-4xl font-bold text-[var(--text)]">{plan.price}</span>
                  <span className="text-[var(--text-secondary)]">{plan.period}</span>
                </div>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">{plan.description}</p>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                      <FiCheckCircle className="w-5 h-5 text-green-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button 
                  variant={plan.highlighted ? "primary" : "outline"} 
                  width="full" 
                  className="mt-6"
                >
                  {plan.price === "Custom" ? "Contact Sales" : "Choose Plan"}
                </Button>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-[var(--secondary)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-[var(--text)]">Courses With Price</h2>
              <p className="mt-3 text-lg text-[var(--text-secondary)]">
                Compare packages directly from the home page and open the full routed courses page for more detail.
              </p>
            </div>
            <Link to="/courses" className="text-sm font-semibold text-[var(--primary)] hover:underline">
              Open courses page
            </Link>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {pricingPlans.map((plan) => (
              <Card key={plan.name} className="!p-6" hover={true}>
                <p className="text-xl font-semibold text-[var(--text)]">{plan.name}</p>
                <p className="mt-4 text-3xl font-bold text-[var(--primary)]">
                  {plan.price}
                  <span className="text-base font-medium text-[var(--text-secondary)]">{plan.period}</span>
                </p>
                <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">{plan.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-[var(--primary)] to-[var(--primary-hover)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            Ready to Transform Your Institute?
          </h2>
          <p className="mt-4 text-lg text-white/80">
            Join thousands of educators who have already modernized their teaching process.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth/register">
              <Button variant="secondary" size="large" className="!bg-white !text-[var(--primary)]">
                Start Free Trial
              </Button>
            </Link>
            <Link to="/auth/login">
              <Button variant="outline" size="large" className="!border-white !text-white hover:!bg-white/10">
                Schedule Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;
