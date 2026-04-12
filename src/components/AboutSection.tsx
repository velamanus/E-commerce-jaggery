import logo from "@/assets/logo.jpg";

const AboutSection = () => {
  return (
    <section id="about" className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="animate-fade-in-up">
            <img src={logo} alt="शुद्ध देसी गुड़" className="w-64 h-64 mx-auto rounded-2xl object-cover" style={{ boxShadow: 'var(--shadow-warm)' }} />
          </div>
          <div className="animate-fade-in-up stagger-2">
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-6">
              Why Choose Our Jaggery?
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <div className="flex gap-3">
                <span className="text-2xl">🌱</span>
                <div>
                  <h3 className="font-semibold text-foreground">100% Organic</h3>
                  <p>No chemicals, no preservatives — just pure sugarcane goodness.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="text-2xl">🏺</span>
                <div>
                  <h3 className="font-semibold text-foreground">Traditional Process</h3>
                  <p>Made using age-old methods to preserve nutrients and authentic flavor.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="text-2xl">💪</span>
                <div>
                  <h3 className="font-semibold text-foreground">Rich in Nutrients</h3>
                  <p>Packed with iron, minerals, and antioxidants for a healthier lifestyle.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="text-2xl">🚚</span>
                <div>
                  <h3 className="font-semibold text-foreground">Farm to Table</h3>
                  <p>Directly sourced from farmers, ensuring freshness and fair trade.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
