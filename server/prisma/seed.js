const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

function readRegistrySample() {
  const samplePath = path.resolve(process.cwd(), "registry_sample.json");
  const raw = fs.readFileSync(samplePath, "utf8");
  return JSON.parse(raw);
}

async function seedAdmin() {
  const adminEmail = process.env.ADMIN_EMAIL || "admin@unnssaa.org";
  const adminPassword = process.env.ADMIN_PASSWORD || "ChangeMeNow123!";
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      fullName: "UNNSSAA Admin",
      email: adminEmail,
      passwordHash,
      role: "SUPERADMIN"
    }
  });
}

async function seedMembers(data) {
  if (!Array.isArray(data.members) || data.members.length === 0) return;

  await prisma.memberProfile.createMany({
    data: data.members.map((member) => ({
      name: member.name,
      classYear: member.classYear,
      profession: member.profession,
      chapter: member.chapter,
      location: member.location,
      status: member.status || "Active",
      verified: Boolean(member.verified),
      joinedAt: member.joinedAt ? new Date(member.joinedAt) : null
    })),
    skipDuplicates: true
  });
}

async function seedEvents(data) {
  if (!Array.isArray(data.events) || data.events.length === 0) return;

  await prisma.event.createMany({
    data: data.events.map((event) => ({
      title: event.title,
      date: event.date ? new Date(event.date) : new Date(),
      schedule: event.schedule,
      type: event.type,
      location: event.location,
      status: "ACTIVE"
    }))
  });
}

async function seedDonations(data) {
  if (!Array.isArray(data.donations) || data.donations.length === 0) return;

  await prisma.donation.createMany({
    data: data.donations.map((donation) => ({
      donorName: donation.donor,
      classYear: donation.classYear,
      amount: donation.amount,
      details: donation.details,
      status: "ACTIVE"
    }))
  });
}

async function seedGrievances(data) {
  if (!Array.isArray(data.grievances) || data.grievances.length === 0) return;

  for (const grievance of data.grievances) {
    await prisma.grievance.upsert({
      where: { trackingId: grievance.trackingId },
      update: {},
      create: {
        trackingId: grievance.trackingId,
        category: grievance.category,
        message: grievance.message,
        status: grievance.status || "Received",
        submittedAt: grievance.at ? new Date(grievance.at) : new Date()
      }
    });
  }
}

async function seedWhistleReports(data) {
  if (!Array.isArray(data.whistleReports) || data.whistleReports.length === 0) return;

  for (const report of data.whistleReports) {
    await prisma.whistleReport.upsert({
      where: { trackingId: report.trackingId },
      update: {},
      create: {
        trackingId: report.trackingId,
        note: report.note,
        submittedAt: report.at ? new Date(report.at) : new Date(),
        isAnonymous: true
      }
    });
  }
}

async function seedCareers(data) {
  if (!Array.isArray(data.careers) || data.careers.length === 0) return;

  await prisma.careerOpportunity.createMany({
    data: data.careers.map((career) => ({
      title: career.title,
      company: career.company,
      location: career.location,
      type: career.type,
      description: career.description,
      status: "ACTIVE"
    }))
  });
}

async function seedMentors(data) {
  const defaultMentors = [
    {
      name: "Dr. Jane Doe",
      profession: "Data Scientist",
      company: "Google",
      expertise: "Technology",
      bio: "Passionate about helping young alumni navigate the tech sector."
    },
    {
      name: "John Smith",
      profession: "Investment Banker",
      company: "Goldman Sachs",
      expertise: "Finance",
      bio: "15 years in Wall Street. Open to reviewing resumes and conducting mock interviews."
    }
  ];

  const mentors = Array.isArray(data.mentors) && data.mentors.length > 0 ? data.mentors : defaultMentors;

  await prisma.mentorProfile.createMany({
    data: mentors.map((mentor) => ({
      name: mentor.name,
      profession: mentor.profession,
      company: mentor.company,
      expertise: mentor.expertise,
      bio: mentor.bio,
      status: "ACTIVE"
    }))
  });
}

async function main() {
  const data = readRegistrySample();

  await seedAdmin();
  await seedMembers(data);
  await seedEvents(data);
  await seedDonations(data);
  await seedGrievances(data);
  await seedWhistleReports(data);
  await seedCareers(data);
  await seedMentors(data);

  console.log("Database seeded successfully.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
