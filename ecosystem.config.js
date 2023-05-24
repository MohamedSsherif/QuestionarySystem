module.exports = {
    apps: [
      {
        name: "my-app",
        script: "app.ts",
        interpreter: "./node_modules/.bin/ts-node",
        instances: 2,
        env: {
          NODE_ENV: "production",
          PORT: 3000,
        },
      },
    ],
  };