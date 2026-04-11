import prisma from "../src/lib/prisma";

async function main() {
  console.log("🌱 Seeding ECOS database...\n");

  // Clean existing data
  await prisma.taskFile.deleteMany();
  await prisma.taskComment.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.aiSession.deleteMany();
  await prisma.task.deleteMany();
  await prisma.pipeline.deleteMany();
  await prisma.user.deleteMany();
  await prisma.role.deleteMany();
  await prisma.committee.deleteMany();

  // Create Committee
  const committee = await prisma.committee.create({
    data: {
      name: "IEEE Student Branch - VITB",
      year: "2025-2026",
      status: "active",
    },
  });
  console.log("✅ Committee created:", committee.name);

  // Create Roles
  const devRole = await prisma.role.create({
    data: {
      committeeId: committee.id,
      name: "Developer",
      tier: "MASTER",
      permissions: JSON.stringify({ all: true }),
      responsibilities: JSON.stringify(["Build and maintain ECOS", "Manage deployments"]),
    },
  });

  const foundingMemberRole = await prisma.role.create({
    data: {
      committeeId: committee.id,
      name: "Founding Member",
      tier: "MASTER",
      permissions: JSON.stringify({ all: true }),
      responsibilities: JSON.stringify(["Vision building", "Strategic Oversight"]),
    },
  });

  const masterRole = await prisma.role.create({
    data: {
      committeeId: committee.id,
      name: "Faculty Advisor",
      tier: "MASTER",
      permissions: JSON.stringify({ all: true }),
      responsibilities: JSON.stringify(["Oversee all operations", "Approve budgets"]),
    },
  });

  const chairRole = await prisma.role.create({
    data: {
      committeeId: committee.id,
      name: "SB Chairperson",
      tier: "LEADERSHIP",
      permissions: JSON.stringify({ manageUsers: true, managePipelines: true, manageTasks: true }),
      responsibilities: JSON.stringify(["Lead the branch", "Coordinate committees", "Strategic planning"]),
    },
  });

  const viceChairRole = await prisma.role.create({
    data: {
      committeeId: committee.id,
      name: "SB Vice chair",
      tier: "LEADERSHIP",
      permissions: JSON.stringify({ managePipelines: true, manageTasks: true }),
      responsibilities: JSON.stringify(["Support the chair", "Manage day-to-day operations"]),
    },
  });

  const secretaryRole = await prisma.role.create({
    data: {
      committeeId: committee.id,
      name: "SB Secretary",
      tier: "OPERATIONS",
      permissions: JSON.stringify({ manageTasks: true, viewReports: true }),
      responsibilities: JSON.stringify(["Document proceedings", "Manage communications"]),
    },
  });

  const webmasterRole = await prisma.role.create({
    data: {
      committeeId: committee.id,
      name: "SB Webmaster",
      tier: "OPERATIONS",
      permissions: JSON.stringify({ manageSystem: true, viewLogs: true }),
      responsibilities: JSON.stringify(["Maintain ECOS platform", "Manage system access"]),
    },
  });

  const treasurerRole = await prisma.role.create({
    data: {
      committeeId: committee.id,
      name: "Treasurer",
      tier: "OPERATIONS",
      permissions: JSON.stringify({ manageBudget: true, viewReports: true }),
      responsibilities: JSON.stringify(["Manage finances", "Track expenditures"]),
    },
  });

  const techLeadRole = await prisma.role.create({
    data: {
      committeeId: committee.id,
      name: "Technical Lead",
      tier: "OPERATIONS",
      permissions: JSON.stringify({ manageTasks: true }),
      responsibilities: JSON.stringify(["Lead technical projects", "Mentor team members"]),
    },
  });

  const memberRole = await prisma.role.create({
    data: {
      committeeId: committee.id,
      name: "Executive Member",
      tier: "MEMBER",
      permissions: JSON.stringify({ viewTasks: true, updateOwnTasks: true }),
      responsibilities: JSON.stringify(["Complete assigned tasks", "Participate in events"]),
    },
  });

  console.log("✅ 10 Roles created");

  const devUser = await prisma.user.create({
    data: {
      committeeId: committee.id,
      roleId: devRole.id,
      name: "System Developer",
      email: "developer@ieeesb.org",
      passwordHash: "dev123",
      semester: 6,
      contribution: "Built ECOS core platform and deployment pipelines",
    },
  });

  const founder = await prisma.user.create({
    data: {
      committeeId: committee.id,
      roleId: foundingMemberRole.id,
      name: "Aaryan Singh",
      email: "founder@ieeesb.org",
      passwordHash: "founder123",
      semester: 8,
      contribution: "Established the branch core charter and led first 5 major hackathons",
    },
  });

  const advisor = await prisma.user.create({
    data: {
      committeeId: committee.id,
      roleId: masterRole.id,
      name: "Dr. Rajesh Kumar",
      email: "advisor@ieeesb.org",
      passwordHash: "admin123",
      semester: null,
      contribution: "Guided over 20+ award-winning project teams",
    },
  });

  const chair = await prisma.user.create({
    data: {
      committeeId: committee.id,
      roleId: chairRole.id,
      name: "Advik Gupta",
      email: "chair@ieeesb.org",
      passwordHash: "chair123",
      semester: 6,
      contribution: "Hosted IEEE TechSprint 2025 and managed 50+ members",
    },
  });

  const viceChair = await prisma.user.create({
    data: {
      committeeId: committee.id,
      roleId: viceChairRole.id,
      name: "Priya Sharma",
      email: "vicechair@ieeesb.org",
      passwordHash: "vc123",
      semester: 6,
      contribution: "Increased active membership by 35% in Q3",
    },
  });

  const secretary = await prisma.user.create({
    data: {
      committeeId: committee.id,
      roleId: secretaryRole.id,
      name: "Rohan Mehta",
      email: "secretary@ieeesb.org",
      passwordHash: "sec123",
      semester: 5,
      contribution: "Streamlined communication with alumni network",
    },
  });

  const treasurer = await prisma.user.create({
    data: {
      committeeId: committee.id,
      roleId: treasurerRole.id,
      name: "Aisha Patel",
      email: "treasurer@ieeesb.org",
      passwordHash: "tres123",
      semester: 5,
      contribution: "Secured $5K in sponsor funds for annual flagship event",
    },
  });

  const webmaster = await prisma.user.create({
    data: {
      committeeId: committee.id,
      roleId: webmasterRole.id,
      name: "Kevin Mitnick",
      email: "webmaster@ieeesb.org",
      passwordHash: "web123",
      semester: 6,
      contribution: "Optimized ECOS backend response times by 40%",
    },
  });

  const techLead = await prisma.user.create({
    data: {
      committeeId: committee.id,
      roleId: techLeadRole.id,
      name: "Vikram Singh",
      email: "techlead@ieeesb.org",
      passwordHash: "tech123",
      semester: 7,
      contribution: "Led development of open-source campus map tool",
    },
  });

  const member1 = await prisma.user.create({
    data: {
      committeeId: committee.id,
      roleId: memberRole.id,
      name: "Neha Reddy",
      email: "neha@ieeesb.org",
      passwordHash: "member123",
      semester: 4,
      contribution: "Organized 3 guest lectures",
    },
  });

  const member2 = await prisma.user.create({
    data: {
      committeeId: committee.id,
      roleId: memberRole.id,
      name: "Arjun Das",
      email: "arjun@ieeesb.org",
      passwordHash: "member123",
      semester: 3,
      contribution: "Top contributor in open source hacktoberfest",
    },
  });

  console.log("✅ 11 Users created");

  // Create Pipelines
  const eventPipeline = await prisma.pipeline.create({
    data: {
      committeeId: committee.id,
      roleId: chairRole.id,
      type: "EVENT",
      title: "TechNova 2026 — Annual Hackathon",
      description: "Complete planning and execution pipeline for our flagship 48-hour hackathon event.",
    },
  });

  const workshopPipeline = await prisma.pipeline.create({
    data: {
      committeeId: committee.id,
      roleId: techLeadRole.id,
      type: "WORKSHOP",
      title: "AI/ML Workshop Series",
      description: "4-part workshop series covering fundamentals to advanced topics in machine learning.",
    },
  });

  const outreachPipeline = await prisma.pipeline.create({
    data: {
      committeeId: committee.id,
      roleId: viceChairRole.id,
      type: "GENERAL",
      title: "Membership Drive Q1",
      description: "Outreach campaign to recruit new IEEE members from freshmen and sophomore batches.",
    },
  });

  const budgetPipeline = await prisma.pipeline.create({
    data: {
      committeeId: committee.id,
      roleId: treasurerRole.id,
      type: "GENERAL",
      title: "Budget Planning FY 2026",
      description: "Annual budget allocation and approval workflow for all branch activities.",
    },
  });

  console.log("✅ 4 Pipelines created");

  // Create Tasks for TechNova Hackathon
  const tasks = await Promise.all([
    prisma.task.create({
      data: {
        pipelineId: eventPipeline.id,
        title: "Book venue & logistics",
        description: "Reserve auditorium, arrange tables, WiFi, power strips, and projectors for 200+ participants.",
        status: "DONE",
        priority: "HIGH",
        assignedTo: viceChair.id,
        createdBy: chair.id,
        deadline: new Date("2026-03-15"),
      },
    }),
    prisma.task.create({
      data: {
        pipelineId: eventPipeline.id,
        title: "Design event branding & posters",
        description: "Create logo, social media banners, print posters, and email templates with consistent branding.",
        status: "DONE",
        priority: "MEDIUM",
        assignedTo: member1.id,
        createdBy: chair.id,
        deadline: new Date("2026-03-20"),
      },
    }),
    prisma.task.create({
      data: {
        pipelineId: eventPipeline.id,
        title: "Secure sponsors (minimum 3)",
        description: "Reach out to tech companies for sponsorship. Prepare sponsorship deck with tier options.",
        status: "IN_PROGRESS",
        priority: "CRITICAL",
        assignedTo: chair.id,
        createdBy: advisor.id,
        deadline: new Date("2026-04-01"),
      },
    }),
    prisma.task.create({
      data: {
        pipelineId: eventPipeline.id,
        title: "Set up registration portal",
        description: "Deploy registration form on website, integrate payment gateway for entry fees.",
        status: "IN_PROGRESS",
        priority: "HIGH",
        assignedTo: techLead.id,
        createdBy: chair.id,
        deadline: new Date("2026-04-05"),
      },
    }),
    prisma.task.create({
      data: {
        pipelineId: eventPipeline.id,
        title: "Recruit mentors & judges",
        description: "Invite 10 industry professionals as judges and 15 mentors for different tracks.",
        status: "TODO",
        priority: "HIGH",
        assignedTo: viceChair.id,
        createdBy: chair.id,
        deadline: new Date("2026-04-10"),
      },
    }),
    prisma.task.create({
      data: {
        pipelineId: eventPipeline.id,
        title: "Prepare problem statements",
        description: "Draft 5 problem statements across tracks: HealthTech, EdTech, FinTech, GreenTech, Social Impact.",
        status: "TODO",
        priority: "MEDIUM",
        assignedTo: techLead.id,
        createdBy: chair.id,
        deadline: new Date("2026-04-12"),
      },
    }),
    prisma.task.create({
      data: {
        pipelineId: eventPipeline.id,
        title: "Plan catering & refreshments",
        description: "Arrange meals for 48 hours. Vegetarian & non-veg options. Late-night snack bars.",
        status: "REVIEW",
        priority: "MEDIUM",
        assignedTo: secretary.id,
        createdBy: viceChair.id,
        deadline: new Date("2026-04-08"),
      },
    }),
    prisma.task.create({
      data: {
        pipelineId: eventPipeline.id,
        title: "Set up prize distribution plan",
        description: "Define prize amounts, certificates, goodies for winners and participants.",
        status: "TODO",
        priority: "LOW",
        assignedTo: treasurer.id,
        createdBy: chair.id,
        deadline: new Date("2026-04-15"),
      },
    }),
  ]);

  // Tasks for AI/ML Workshop
  await Promise.all([
    prisma.task.create({
      data: {
        pipelineId: workshopPipeline.id,
        title: "Prepare Session 1: Python for ML",
        description: "Slides, Jupyter notebooks, and exercises covering NumPy, Pandas, Matplotlib basics.",
        status: "DONE",
        priority: "HIGH",
        assignedTo: techLead.id,
        createdBy: techLead.id,
        deadline: new Date("2026-03-10"),
      },
    }),
    prisma.task.create({
      data: {
        pipelineId: workshopPipeline.id,
        title: "Prepare Session 2: Supervised Learning",
        description: "Linear/logistic regression, decision trees, random forests with scikit-learn.",
        status: "IN_PROGRESS",
        priority: "HIGH",
        assignedTo: techLead.id,
        createdBy: techLead.id,
        deadline: new Date("2026-04-01"),
      },
    }),
    prisma.task.create({
      data: {
        pipelineId: workshopPipeline.id,
        title: "Set up cloud lab environment",
        description: "Configure Google Colab notebooks and GitHub Classroom for all 50 participants.",
        status: "TODO",
        priority: "MEDIUM",
        assignedTo: member2.id,
        createdBy: techLead.id,
        deadline: new Date("2026-04-05"),
      },
    }),
  ]);

  // Tasks for Membership Drive
  await Promise.all([
    prisma.task.create({
      data: {
        pipelineId: outreachPipeline.id,
        title: "Create Instagram campaign",
        description: "Design 10 posts + 5 reels highlighting IEEE benefits, member testimonials, and event highlights.",
        status: "IN_PROGRESS",
        priority: "HIGH",
        assignedTo: member1.id,
        createdBy: viceChair.id,
        deadline: new Date("2026-04-01"),
      },
    }),
    prisma.task.create({
      data: {
        pipelineId: outreachPipeline.id,
        title: "Organize info session",
        description: "Book a classroom, create presentation, arrange Q&A with current members.",
        status: "TODO",
        priority: "MEDIUM",
        assignedTo: secretary.id,
        createdBy: viceChair.id,
        deadline: new Date("2026-04-10"),
      },
    }),
  ]);

  // Tasks for Budget
  await Promise.all([
    prisma.task.create({
      data: {
        pipelineId: budgetPipeline.id,
        title: "Collect department budget requests",
        description: "Gather budget proposals from all department heads with itemized line items.",
        status: "IN_PROGRESS",
        priority: "HIGH",
        assignedTo: treasurer.id,
        createdBy: chair.id,
        deadline: new Date("2026-03-25"),
      },
    }),
    prisma.task.create({
      data: {
        pipelineId: budgetPipeline.id,
        title: "Prepare consolidated budget sheet",
        description: "Merge all requests into master spreadsheet with categories and priority rankings.",
        status: "TODO",
        priority: "MEDIUM",
        assignedTo: treasurer.id,
        createdBy: chair.id,
        deadline: new Date("2026-04-05"),
      },
    }),
  ]);

  console.log("✅ 15 Tasks created across 4 pipelines");

  // Create notifications
  await Promise.all([
    prisma.notification.create({
      data: {
        senderId: chair.id,
        recipientId: viceChair.id,
        committeeId: committee.id,
        type: "TASK_ASSIGNED",
        scope: "PERSONAL",
        message: 'You\'ve been assigned to task: "Recruit mentors & judges"',
      },
    }),
    prisma.notification.create({
      data: {
        senderId: chair.id,
        recipientId: techLead.id,
        committeeId: committee.id,
        type: "TASK_ASSIGNED",
        scope: "PERSONAL",
        message: 'You\'ve been assigned to task: "Set up registration portal"',
      },
    }),
    prisma.notification.create({
      data: {
        senderId: advisor.id,
        recipientId: chair.id,
        committeeId: committee.id,
        type: "GENERAL",
        scope: "PERSONAL",
        message: "Please submit the sponsor deck for review by Friday.",
      },
    }),
    prisma.notification.create({
      data: {
        senderId: viceChair.id,
        recipientId: secretary.id,
        committeeId: committee.id,
        type: "TASK_UPDATED",
        scope: "PERSONAL",
        message: 'Task "Plan catering & refreshments" moved to REVIEW',
      },
    }),
    prisma.notification.create({
      data: {
        senderId: null,
        recipientId: chair.id,
        committeeId: committee.id,
        type: "SYSTEM",
        scope: "PERSONAL",
        message: "Budget deadline approaching: 3 days remaining for Q1 budget approval.",
        isRead: true,
      },
    }),
  ]);

  console.log("✅ 5 Notifications created");

  // Add some task comments
  await Promise.all([
    prisma.taskComment.create({
      data: {
        taskId: tasks[2]!.id, // Secure sponsors
        userId: chair.id,
        content: "Sent proposals to Google, Microsoft, and GitHub. Waiting for responses.",
      },
    }),
    prisma.taskComment.create({
      data: {
        taskId: tasks[2]!.id,
        userId: advisor.id,
        content: "Try reaching out to local startups too. They're often more responsive for student events.",
      },
    }),
    prisma.taskComment.create({
      data: {
        taskId: tasks[3]!.id, // Registration portal
        userId: techLead.id,
        content: "Using Razorpay for payments. Test environment is live at staging.ieeesb.org/register",
      },
    }),
  ]);

  console.log("✅ 3 Task Comments created");

  console.log("\n🎉 Seed complete! You can login with:");
  console.log("   developer@ieeesb.org / dev123");
  console.log("   founder@ieeesb.org / founder123");
  console.log("   chair@ieeesb.org / chair123");
  console.log("   advisor@ieeesb.org / admin123");
  console.log("   vicechair@ieeesb.org / vc123");
  console.log("   treasurer@ieeesb.org / tres123");
  console.log("   techlead@ieeesb.org / tech123");
  console.log("   webmaster@ieeesb.org / web123");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
