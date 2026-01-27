import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import volunteerImage from "@assets/Volunteer.png";

export default function Volunteer() {
  return (
    <div className="min-h-screen">
      <section className="relative h-[600px] md:h-[700px] overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={volunteerImage}
            alt="Volunteer at Born Again Gardens"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
        </div>
        <div className="relative h-full flex flex-col items-center justify-center text-center px-4 max-w-4xl mx-auto">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-white">Volunteer</h1>
          <p className="text-lg md:text-xl text-white/90 max-w-2xl font-serif">
            Join us in cultivating gardens of new life. Your time and energy help make our mission possible.
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 md:px-8 py-12">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">
              Content for the Volunteer page will be added here.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
