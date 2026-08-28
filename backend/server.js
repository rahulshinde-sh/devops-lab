const express = require("express");
const cors = require("cors");
const si = require("systeminformation");
const os = require("os");
const { exec } = require("child_process");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());


// Basic API
app.get("/", (req, res) => {
    res.json({
        message: "DevOps Lab API is running",
        version: "1.0.0",
        environment: process.env.NODE_ENV || "development"
    });
});


// Health check
app.get("/api/health", (req, res) => {
    res.json({
        status: "healthy",
        service: "backend",
        timestamp: new Date().toISOString()
    });
});


// Real server information
app.get("/api/server", async (req, res) => {

    try {

        const [
            cpu,
            memory,
            disk,
            system
        ] = await Promise.all([
            si.currentLoad(),
            si.mem(),
            si.fsSize(),
            si.system()
        ]);


        // CPU
        const cpuUsage = cpu.currentLoad.toFixed(1);


        // RAM
        const totalMemoryGB = (
            memory.total / 1024 / 1024 / 1024
        ).toFixed(2);

        const usedMemoryGB = (
            (memory.total - memory.available) /
            1024 / 1024 / 1024
        ).toFixed(2);

        const memoryUsage = (
            ((memory.total - memory.available) /
            memory.total) * 100
        ).toFixed(1);


        // Disk
        let diskUsage = 0;
        let diskTotalGB = 0;
        let diskUsedGB = 0;

        if (disk.length > 0) {

            const rootDisk = disk.find(
                d => d.mount === "/"
            ) || disk[0];

            diskUsage = rootDisk.use.toFixed(1);

            diskTotalGB = (
                rootDisk.size /
                1024 / 1024 / 1024
            ).toFixed(2);

            diskUsedGB = (
                rootDisk.used /
                1024 / 1024 / 1024
            ).toFixed(2);
        }


        // Uptime
        const uptimeSeconds = os.uptime();

        const uptimeHours = Math.floor(
            uptimeSeconds / 3600
        );

        const uptimeMinutes = Math.floor(
            (uptimeSeconds % 3600) / 60
        );


        // Docker containers
        const dockerContainers = await new Promise((resolve) => {

            exec(
                "docker ps -q | wc -l",
                (error, stdout) => {

                    if (error) {
                        resolve(0);
                        return;
                    }

                    resolve(
                        parseInt(stdout.trim()) || 0
                    );
                }
            );

        });


        res.json({

            status: "online",

            hostname: os.hostname(),

            operatingSystem: `${system.manufacturer} ${system.model}`,

            cpu: {
                usage: Number(cpuUsage)
            },

            memory: {
                usage: Number(memoryUsage),
                used: Number(usedMemoryGB),
                total: Number(totalMemoryGB)
            },

            disk: {
                usage: Number(diskUsage),
                used: Number(diskUsedGB),
                total: Number(diskTotalGB)
            },

            uptime: {
                hours: uptimeHours,
                minutes: uptimeMinutes
            },

            containers: dockerContainers,

            environment:
                process.env.NODE_ENV || "development",

            timestamp: new Date().toISOString()
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            status: "error",
            message: "Unable to read server information"
        });

    }

});


app.listen(PORT, "0.0.0.0", () => {

    console.log(
        `Backend running on port ${PORT}`
    );

  });
