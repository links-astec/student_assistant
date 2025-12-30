// GET /api/contacts - Fetch contacts from backend
// Syncs contact directory from the Coventry Student Assistant backend

import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

// Backend API URL
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";

// GET all contacts or emergency contacts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const search = searchParams.get("q");
    const emergency = searchParams.get("emergency");

    let endpoint = `${BACKEND_URL}/api/email/contacts`;
    
    if (emergency === "true") {
      // Fetch emergency contacts
      endpoint = `${BACKEND_URL}/api/email/emergency`;
    } else if (category) {
      endpoint = `${BACKEND_URL}/api/email/contacts/category/${encodeURIComponent(category)}`;
    } else if (search) {
      endpoint = `${BACKEND_URL}/api/email/contacts/search?q=${encodeURIComponent(search)}`;
    }

    const response = await fetch(endpoint);
    
    if (!response.ok) {
      throw new Error(`Backend contacts failed: ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      ...data,
    });
  } catch (error) {
    console.error("[Contacts API] Error:", error);
    
    // Return fallback contacts
    return NextResponse.json({
      success: false,
      error: "Backend unavailable",
      contacts: [
        {
          department: "Student Support",
          email: "studentsupport@coventry.ac.uk",
          phone: "+44 (0)24 7765 7688",
          location: "TheHub",
          openingHours: "Monday-Friday: 9:00am - 5:00pm",
        },
      ],
    });
  }
}
