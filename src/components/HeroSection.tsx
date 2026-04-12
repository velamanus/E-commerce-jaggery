import { Button } from "@/components/ui/button";

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden py-20 md:py-32">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/5" />
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 animate-fade-in-up">
            🌿 100% Pure & Natural
          </span>
          <h1 className="text-4xl md:text-6xl font-heading font-bold text-foreground mb-6 animate-fade-in-up stagger-1 leading-tight">
            Pure & Natural <br />
            <span className="text-primary">Organic Jaggery</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 animate-fade-in-up stagger-2 max-w-2xl mx-auto">
            Experience the authentic taste of traditional jaggery, made from the finest sugarcane with no chemicals or preservatives. A healthier sweetener for your family.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up stagger-3">
            <Button size="lg" asChild className="text-base px-8">
              <a href="#products">Shop Now</a>
            </Button>
            <Button variant="outline" size="lg" asChild className="text-base px-8">
              <a href="#about">Learn More</a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
