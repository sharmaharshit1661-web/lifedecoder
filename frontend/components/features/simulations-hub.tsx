"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Zap, ArrowRight } from "lucide-react";
import SalarySim from "./salary-sim";
import JobInterviewSim from "./job-interview-sim";

const SIMULATIONS = [
  {
    title: "Job Interview",
    description: "Practice handling a real job interview scenario with AI feedback",
    difficulty: "Beginner",
    xp: 100,
    color: "from-green-500/20 to-transparent",
    available: true,
  },
  {
    title: "Salary Negotiation",
    description: "Learn to negotiate your worth and secure better compensation",
    difficulty: "Intermediate",
    xp: 150,
    color: "from-blue-500/20 to-transparent",
    available: true,
  },
  {
    title: "First Apartment",
    description: "Navigate the process of finding and renting your first place",
    difficulty: "Beginner",
    xp: 120,
    color: "from-green-500/20 to-transparent",
    available: false,
  },
  {
    title: "Family Conflict",
    description: "Handle difficult conversations with family members",
    difficulty: "Advanced",
    xp: 200,
    color: "from-red-500/20 to-transparent",
    available: false,
  },
  {
    title: "Budget Crisis",
    description: "Manage an unexpected financial emergency",
    difficulty: "Intermediate",
    xp: 160,
    color: "from-orange-500/20 to-transparent",
    available: false,
  },
  {
    title: "Career Change",
    description: "Explore switching careers and plan your transition",
    difficulty: "Advanced",
    xp: 180,
    color: "from-indigo-500/20 to-transparent",
    available: false,
  },
];

function SimulationsHub() {
  const [activeSimulation, setActiveSimulation] = useState<string | null>(null);

  if (activeSimulation === "Salary Negotiation") {
    return <SalarySim onBack={() => setActiveSimulation(null)} />;
  }

  if (activeSimulation === "Job Interview") {
    return <JobInterviewSim onBack={() => setActiveSimulation(null)} />;
  }

  return (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/20 border border-secondary/40 mb-4">
          <Zap className="w-4 h-4 text-primary" />
          <span className="text-sm text-foreground">Real-World Scenarios</span>
        </div>
        <h1 className="text-3xl font-bold mb-2">Life Simulations</h1>
        <p className="text-muted-foreground">
          Experience realistic scenarios and learn from your decisions. Earn XP and badges!
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {SIMULATIONS.map((sim, index) => (
          <Card
            key={index}
            className={`bg-gradient-to-br ${sim.color} border-border hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 transition-all overflow-hidden group cursor-pointer ${
              !sim.available ? "opacity-50" : ""
            }`}
            onClick={() => sim.available && setActiveSimulation(sim.title)}
          >
            <div className="p-6 h-full flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                      {sim.title}
                      {sim.available && (
                        <span className="text-xs bg-teal-500 text-white px-2 py-1 rounded-full">NEW</span>
                      )}
                      {!sim.available && (
                        <span className="text-xs bg-gray-500 text-white px-2 py-1 rounded-full">SOON</span>
                      )}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {sim.description}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border/50">
                <div className="flex gap-4 text-xs">
                  <span className="px-2 py-1 rounded bg-muted text-muted-foreground">
                    {sim.difficulty}
                  </span>
                  <span className="px-2 py-1 rounded bg-primary/20 text-primary font-medium">
                    +{sim.xp} XP
                  </span>
                </div>
                <ArrowRight className={`w-4 h-4 transition-colors ${
                  sim.available 
                    ? "text-muted-foreground group-hover:text-primary" 
                    : "text-muted-foreground/50"
                }`} />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export { SimulationsHub as default };