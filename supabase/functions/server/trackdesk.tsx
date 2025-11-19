import { Hono } from "npm:hono@4";

export function registerTrackdeskRoutes(app: Hono) {
  console.log("🎯 Registering Trackdesk postback routes...");

  // Fire conversion postback to Trackdesk
  app.post("/make-server-cf244566/trackdesk/conversion", async (c) => {
    try {
      const body = await c.req.json();
      const {
        cid,
        amount,
        externalId,
        customerId,
        advS1,
        advS2,
        advS3,
        advS4,
        advS5,
        status = "CONVERSION_STATUS_APPROVED"
      } = body;

      // Validate required fields
      if (!cid) {
        console.error("❌ Missing Trackdesk CID");
        return c.json({ error: "Missing Trackdesk CID" }, 400);
      }

      // Build the postback payload
      const payload: any = {
        conversionTypeCode: "sale",
        cid: cid,
        status: status,
      };

      // Add amount if provided (revenue share)
      if (amount) {
        payload.amount = {
          value: amount.toString()
        };
        payload.currency = {
          code: "USD"
        };
      }

      // Add external ID for deduplication
      if (externalId) {
        payload.externalId = externalId;
      }

      // Add customer ID
      if (customerId) {
        payload.customerId = customerId;
      }

      // Add custom parameters
      const customParams: any = {};
      if (advS1) customParams.advS1 = advS1;
      if (advS2) customParams.advS2 = advS2;
      if (advS3) customParams.advS3 = advS3;
      if (advS4) customParams.advS4 = advS4;
      if (advS5) customParams.advS5 = advS5;

      if (Object.keys(customParams).length > 0) {
        payload.customParams = customParams;
      }

      console.log("📊 Firing Trackdesk conversion postback:", JSON.stringify(payload, null, 2));

      // Fire the postback to Trackdesk
      const trackdeskResponse = await fetch(
        "https://directwebinteractive.trackdesk.com/tracking/conversion/v1",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const responseText = await trackdeskResponse.text();
      
      if (!trackdeskResponse.ok) {
        console.error("❌ Trackdesk postback failed:", trackdeskResponse.status, responseText);
        return c.json({ 
          error: "Trackdesk postback failed", 
          status: trackdeskResponse.status,
          response: responseText 
        }, 500);
      }

      console.log("✅ Trackdesk conversion posted successfully:", responseText);

      return c.json({ 
        success: true, 
        trackdeskResponse: responseText 
      });

    } catch (error: any) {
      console.error("❌ Error firing Trackdesk conversion:", error);
      return c.json({ error: error.message }, 500);
    }
  });

  // Fire lead postback to Trackdesk (for checkout page visits)
  app.post("/make-server-cf244566/trackdesk/lead", async (c) => {
    try {
      const body = await c.req.json();
      const {
        cid,
        advS1,
        advS2,
        advS3,
        advS4,
        advS5,
      } = body;

      // Validate required fields
      if (!cid) {
        console.error("❌ Missing Trackdesk CID");
        return c.json({ error: "Missing Trackdesk CID" }, 400);
      }

      // Build the postback payload for lead
      const payload: any = {
        conversionTypeCode: "lead",
        cid: cid,
        status: "CONVERSION_STATUS_APPROVED",
      };

      // Add custom parameters
      const customParams: any = {};
      if (advS1) customParams.advS1 = advS1;
      if (advS2) customParams.advS2 = advS2;
      if (advS3) customParams.advS3 = advS3;
      if (advS4) customParams.advS4 = advS4;
      if (advS5) customParams.advS5 = advS5;

      if (Object.keys(customParams).length > 0) {
        payload.customParams = customParams;
      }

      console.log("📊 Firing Trackdesk lead postback:", JSON.stringify(payload, null, 2));

      // Fire the postback to Trackdesk
      const trackdeskResponse = await fetch(
        "https://directwebinteractive.trackdesk.com/tracking/conversion/v1",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const responseText = await trackdeskResponse.text();
      
      if (!trackdeskResponse.ok) {
        console.error("❌ Trackdesk lead postback failed:", trackdeskResponse.status, responseText);
        return c.json({ 
          error: "Trackdesk lead postback failed", 
          status: trackdeskResponse.status,
          response: responseText 
        }, 500);
      }

      console.log("✅ Trackdesk lead posted successfully:", responseText);

      return c.json({ 
        success: true, 
        trackdeskResponse: responseText 
      });

    } catch (error: any) {
      console.error("❌ Error firing Trackdesk lead:", error);
      return c.json({ error: error.message }, 500);
    }
  });
}
