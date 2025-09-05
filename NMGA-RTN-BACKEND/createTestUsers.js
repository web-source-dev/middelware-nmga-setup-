const mongoose = require("mongoose");
const User = require("./models/User"); // Adjust the path if needed
const bcrypt = require("bcryptjs");
const { generateUniqueLoginKey } = require('./utils/loginKeyGenerator');
require("dotenv").config();

const MONGO_URI = process.env.MONGODB_URI;

async function createTestUsers() {
  try {
    await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log("Connected to MongoDB");

    const hashedPassword = await bcrypt.hash("password123", 10);

    // Generate unique login keys for each user
    const adminLoginKey = await generateUniqueLoginKey(User);
    const distributor1LoginKey = await generateUniqueLoginKey(User);
    const distributor2LoginKey = await generateUniqueLoginKey(User);
    const member1LoginKey = await generateUniqueLoginKey(User);
    const member2LoginKey = await generateUniqueLoginKey(User);
    const member3LoginKey = await generateUniqueLoginKey(User);
    const member4LoginKey = await generateUniqueLoginKey(User);
    const member5LoginKey = await generateUniqueLoginKey(User);
    const member6LoginKey = await generateUniqueLoginKey(User);

    const users = [
      { 
        name: "Admin User", 
        email: "admin@test.com", 
        password: hashedPassword, 
        role: "admin", 
        businessName: "Admin Corp", 
        contactPerson: "Admin Contact", 
        phone: "1234567890", 
        address: "123 Admin Street", 
        logo: "", 
        isBlocked: false, 
        isVerified: true,
        login_key: adminLoginKey 
      },
      { 
        name: "Distributor One", 
        email: "distributor1@test.com", 
        password: hashedPassword, 
        role: "distributor", 
        businessName: "Distributor One Ltd", 
        contactPerson: "Dist Contact 1", 
        phone: "1234567891", 
        address: "456 Distributor Street", 
        logo: "", 
        isBlocked: false, 
        isVerified: true,
        login_key: distributor1LoginKey 
      },
      { 
        name: "Distributor Two", 
        email: "distributor2@test.com", 
        password: hashedPassword, 
        role: "distributor", 
        businessName: "Distributor Two Ltd", 
        contactPerson: "Dist Contact 2", 
        phone: "1234567892", 
        address: "789 Distributor Street", 
        logo: "", 
        isBlocked: false, 
        isVerified: true,
        login_key: distributor2LoginKey 
      },
      { 
        name: "Member One", 
        email: "member1@test.com", 
        password: hashedPassword, 
        role: "member", 
        businessName: "Member One Ltd", 
        contactPerson: "Member Contact 1", 
        phone: "1234567894", 
        address: "111 Member Street", 
        logo: "", 
        isBlocked: false, 
        isVerified: true,
        login_key: member1LoginKey 
      },
      { 
        name: "Member Two", 
        email: "member2@test.com", 
        password: hashedPassword, 
        role: "member", 
        businessName: "Member Two Ltd", 
        contactPerson: "Member Contact 2", 
        phone: "1234567895", 
        address: "222 Member Street", 
        logo: "", 
        isBlocked: false, 
        isVerified: true,
        login_key: member2LoginKey 
      },
      { 
        name: "Member Three", 
        email: "member3@test.com", 
        password: hashedPassword, 
        role: "member", 
        businessName: "Member Three Ltd", 
        contactPerson: "Member Contact 3", 
        phone: "1234567896", 
        address: "333 Member Street", 
        logo: "", 
        isBlocked: false, 
        isVerified: true,
        login_key: member3LoginKey 
      },
      { 
        name: "Member Four", 
        email: "member4@test.com", 
        password: hashedPassword, 
        role: "member", 
        businessName: "Member Four Ltd", 
        contactPerson: "Member Contact 4", 
        phone: "1234567897", 
        address: "444 Member Street", 
        logo: "", 
        isBlocked: false, 
        isVerified: true,
        login_key: member4LoginKey 
      },
      { 
        name: "Member Five", 
        email: "member5@test.com", 
        password: hashedPassword, 
        role: "member", 
        businessName: "Member Five Ltd", 
        contactPerson: "Member Contact 5", 
        phone: "1234567898", 
        address: "555 Member Street", 
        logo: "", 
        isBlocked: false, 
        isVerified: true,
        login_key: member5LoginKey 
      },
      { 
        name: "Member Six", 
        email: "member6@test.com", 
        password: hashedPassword, 
        role: "member", 
        businessName: "Member Six Ltd", 
        contactPerson: "Member Contact 6", 
        phone: "1234567899", 
        address: "666 Member Street", 
        logo: "", 
        isBlocked: false, 
        isVerified: true,
        login_key: member6LoginKey 
      }
    ];

    await User.deleteMany({}); // Clear existing test users
    await User.insertMany(users);
    console.log("Test users created successfully");
  } catch (error) {
    console.error("Error creating test users:", error);
  } finally {
    mongoose.connection.close();
  }
}

createTestUsers();
