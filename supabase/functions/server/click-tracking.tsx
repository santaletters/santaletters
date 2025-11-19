import { Hono } from "npm:hono@4";
import * as kv from "./kv_store.tsx";

export function registerClickTrackingRoutes(app: Hono) {
  
  console.log("🔥 Registering click tracking routes...");
  
  // Track affiliate click
  app.get("/make-server-cf244566/track-click/:affiliateId", async (c) => {
    try {
      const affiliateId = c.req.param("affiliateId");
      const url = new URL(c.req.url);
      const subid = url.searchParams.get("subid") || "";
      const subid2 = url.searchParams.get("subid2") || "";
      const subid3 = url.searchParams.get("subid3") || "";
      const subid4 = url.searchParams.get("subid4") || "";
      const subid5 = url.searchParams.get("subid5") || "";
      
      // Get IP address
      const ip = c.req.header("cf-connecting-ip") || 
                 c.req.header("x-forwarded-for")?.split(",")[0] || 
                 "unknown";
      
      // Get user agent
      const userAgent = c.req.header("user-agent") || "unknown";
      
      // Get referrer
      const referrer = c.req.header("referer") || "direct";
      
      const timestamp = new Date().toISOString();
      const clickId = `click_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      
      // Store click data
      const clickData = {
        clickId,
        affiliateId,
        subid,
        subid2,
        subid3,
        subid4,
        subid5,
        ip,
        userAgent,
        referrer,
        timestamp,
        converted: false,
      };
      
      // Save individual click
      await kv.set(`click:${clickId}`, clickData);
      
      // Add to affiliate's click list
      const affiliateClicks: string[] = (await kv.get(`affiliate:${affiliateId}:clicks`) as string[]) || [];
      affiliateClicks.unshift(clickId);
      // Keep last 10,000 clicks
      if (affiliateClicks.length > 10000) {
        affiliateClicks.splice(10000);
      }
      await kv.set(`affiliate:${affiliateId}:clicks`, affiliateClicks);
      
      // Track daily stats
      const today = new Date().toISOString().split("T")[0];
      const dailyKey = `clicks:daily:${affiliateId}:${today}`;
      const dailyStats: any = (await kv.get(dailyKey)) || {
        date: today,
        affiliateId,
        rawClicks: 0,
        uniqueClicks: 0,
        uniqueIps: [],
        subidBreakdown: {},
      };
      
      dailyStats.rawClicks++;
      
      // Track unique clicks (by IP per day)
      if (!dailyStats.uniqueIps) dailyStats.uniqueIps = [];
      if (!Array.isArray(dailyStats.uniqueIps)) {
        dailyStats.uniqueIps = Object.values(dailyStats.uniqueIps);
      }
      
      const uniqueIpsSet = new Set(dailyStats.uniqueIps);
      uniqueIpsSet.add(ip);
      dailyStats.uniqueIps = Array.from(uniqueIpsSet);
      dailyStats.uniqueClicks = dailyStats.uniqueIps.length;
      
      // Track by subid
      if (subid) {
        if (!dailyStats.subidBreakdown) dailyStats.subidBreakdown = {};
        if (!dailyStats.subidBreakdown[subid]) {
          dailyStats.subidBreakdown[subid] = { rawClicks: 0, uniqueClicks: 0, uniqueIps: [] };
        }
        dailyStats.subidBreakdown[subid].rawClicks++;
        if (!dailyStats.subidBreakdown[subid].uniqueIps) {
          dailyStats.subidBreakdown[subid].uniqueIps = [];
        }
        if (!Array.isArray(dailyStats.subidBreakdown[subid].uniqueIps)) {
          dailyStats.subidBreakdown[subid].uniqueIps = Object.values(dailyStats.subidBreakdown[subid].uniqueIps);
        }
        
        const subUniqueIpsSet = new Set(dailyStats.subidBreakdown[subid].uniqueIps);
        subUniqueIpsSet.add(ip);
        dailyStats.subidBreakdown[subid].uniqueIps = Array.from(subUniqueIpsSet);
        dailyStats.subidBreakdown[subid].uniqueClicks = dailyStats.subidBreakdown[subid].uniqueIps.length;
      }
      
      await kv.set(dailyKey, dailyStats);
      
      // Store in session for conversion tracking
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      await kv.set(`session:${sessionId}`, {
        clickId,
        affiliateId,
        subid,
        subid2,
        subid3,
        subid4,
        subid5,
        timestamp,
      });
      
      console.log(`✅ Click tracked: ${clickId} for affiliate ${affiliateId}${subid ? ` (subid: ${subid})` : ""}`);
      
      return c.json({ 
        success: true, 
        sessionId,
        clickId,
      });
    } catch (error: any) {
      console.error("Error tracking click:", error);
      return c.json({ error: "Failed to track click" }, 500);
    }
  });

  // Get click logs for affiliate
  app.get("/make-server-cf244566/affiliate-click-logs/:affiliateId", async (c) => {
    try {
      const affiliateId = c.req.param("affiliateId");
      const url = new URL(c.req.url);
      const limit = parseInt(url.searchParams.get("limit") || "100");
      const subid = url.searchParams.get("subid") || "";
      const startDate = url.searchParams.get("startDate") || "";
      const endDate = url.searchParams.get("endDate") || "";
      
      const affiliateClicks: string[] = (await kv.get(`affiliate:${affiliateId}:clicks`) as string[]) || [];
      
      // Load click details
      const clicks = [];
      for (const clickId of affiliateClicks.slice(0, limit)) {
        const click: any = await kv.get(`click:${clickId}`);
        if (click) {
          // Filter by subid if specified
          if (subid && click.subid !== subid) continue;
          
          // Filter by date range
          if (startDate && click.timestamp < startDate) continue;
          if (endDate && click.timestamp > endDate) continue;
          
          clicks.push(click);
        }
      }
      
      return c.json({ clicks });
    } catch (error: any) {
      console.error("Error fetching click logs:", error);
      return c.json({ error: "Failed to fetch click logs" }, 500);
    }
  });

  // Get affiliate click stats and breakdown
  app.get("/make-server-cf244566/affiliate-click-stats/:affiliateId", async (c) => {
    try {
      const affiliateId = c.req.param("affiliateId");
      const url = new URL(c.req.url);
      const dateRange = url.searchParams.get("dateRange") || "7days";
      
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      
      switch (dateRange) {
        case "today":
          startDate.setHours(0, 0, 0, 0);
          break;
        case "yesterday":
          startDate.setDate(startDate.getDate() - 1);
          startDate.setHours(0, 0, 0, 0);
          endDate.setDate(endDate.getDate() - 1);
          endDate.setHours(23, 59, 59, 999);
          break;
        case "7days":
          startDate.setDate(startDate.getDate() - 7);
          break;
        case "30days":
          startDate.setDate(startDate.getDate() - 30);
          break;
        case "thisMonth":
          startDate.setDate(1);
          startDate.setHours(0, 0, 0, 0);
          break;
        case "lastMonth":
          startDate.setMonth(startDate.getMonth() - 1);
          startDate.setDate(1);
          startDate.setHours(0, 0, 0, 0);
          endDate.setMonth(endDate.getMonth() - 1);
          endDate.setDate(new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0).getDate());
          endDate.setHours(23, 59, 59, 999);
          break;
      }
      
      // Aggregate stats across date range
      const dailyReports = [];
      let totalRawClicks = 0;
      let totalUniqueClicks = 0;
      const allUniqueIps = new Set();
      const subidAggregated: any = {};
      
      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        const dateKey = currentDate.toISOString().split("T")[0];
        const dailyKey = `clicks:daily:${affiliateId}:${dateKey}`;
        const dailyData: any = await kv.get(dailyKey);
        
        if (dailyData) {
          totalRawClicks += dailyData.rawClicks || 0;
          
          // Track unique IPs across all days
          if (dailyData.uniqueIps) {
            const ips = Array.isArray(dailyData.uniqueIps) ? dailyData.uniqueIps : Object.values(dailyData.uniqueIps || {});
            ips.forEach((ip: any) => allUniqueIps.add(ip));
          }
          
          // Aggregate subid data
          if (dailyData.subidBreakdown) {
            for (const [subid, stats] of Object.entries(dailyData.subidBreakdown)) {
              if (!subidAggregated[subid]) {
                subidAggregated[subid] = {
                  subid,
                  rawClicks: 0,
                  uniqueClicks: 0,
                  uniqueIps: new Set(),
                  conversions: 0,
                  revenue: 0,
                  commission: 0,
                };
              }
              const subStats = stats as any;
              subidAggregated[subid].rawClicks += subStats.rawClicks || 0;
              
              const subIps = Array.isArray(subStats.uniqueIps) ? subStats.uniqueIps : Object.values(subStats.uniqueIps || {});
              subIps.forEach((ip: any) => subidAggregated[subid].uniqueIps.add(ip));
            }
          }
          
          dailyReports.push({
            date: dateKey,
            rawClicks: dailyData.rawClicks || 0,
            uniqueClicks: dailyData.uniqueClicks || 0,
          });
        }
        
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      totalUniqueClicks = allUniqueIps.size;
      
      // Convert subid aggregated data
      const subidBreakdown = Object.values(subidAggregated).map((data: any) => ({
        ...data,
        uniqueClicks: data.uniqueIps.size,
        uniqueIps: undefined, // Remove Set from response
      }));
      
      return c.json({
        totalRawClicks,
        totalUniqueClicks,
        dailyReports,
        subidBreakdown,
      });
    } catch (error: any) {
      console.error("Error fetching click stats:", error);
      return c.json({ error: "Failed to fetch click stats" }, 500);
    }
  });

  // Get network-wide click stats (all affiliates)
  app.get("/make-server-cf244566/admin/network-click-stats", async (c) => {
    try {
      const url = new URL(c.req.url);
      const dateRange = url.searchParams.get("dateRange") || "today";
      
      const allAffiliateIds: string[] = (await kv.get("affiliates:all") as string[]) || [];
      
      const networkStats: any = {
        totalRawClicks: 0,
        totalUniqueClicks: 0,
        affiliateBreakdown: [],
      };
      
      for (const affiliateId of allAffiliateIds) {
        const affiliate: any = await kv.get(`affiliate:${affiliateId}`);
        if (!affiliate) continue;
        
        // Calculate stats inline
        const endDate = new Date();
        const startDate = new Date();
        if (dateRange === "today") {
          startDate.setHours(0, 0, 0, 0);
        } else if (dateRange === "7days") {
          startDate.setDate(startDate.getDate() - 7);
        } else if (dateRange === "30days") {
          startDate.setDate(startDate.getDate() - 30);
        }
        
        let totalRawClicks = 0;
        const allUniqueIps = new Set();
        
        const currentDate = new Date(startDate);
        while (currentDate <= endDate) {
          const dateKey = currentDate.toISOString().split("T")[0];
          const dailyKey = `clicks:daily:${affiliateId}:${dateKey}`;
          const dailyData: any = await kv.get(dailyKey);
          
          if (dailyData) {
            totalRawClicks += dailyData.rawClicks || 0;
            if (dailyData.uniqueIps) {
              const ips = Array.isArray(dailyData.uniqueIps) ? dailyData.uniqueIps : Object.values(dailyData.uniqueIps || {});
              ips.forEach((ip: any) => allUniqueIps.add(ip));
            }
          }
          currentDate.setDate(currentDate.getDate() + 1);
        }
        
        const totalUniqueClicks = allUniqueIps.size;
        
        networkStats.totalRawClicks += totalRawClicks;
        networkStats.totalUniqueClicks += totalUniqueClicks;
        
        networkStats.affiliateBreakdown.push({
          affiliateId,
          affiliateName: affiliate.affiliateName,
          rawClicks: totalRawClicks,
          uniqueClicks: totalUniqueClicks,
        });
      }
      
      return c.json(networkStats);
    } catch (error: any) {
      console.error("Error fetching network click stats:", error);
      return c.json({ error: "Failed to fetch network click stats" }, 500);
    }
  });
}