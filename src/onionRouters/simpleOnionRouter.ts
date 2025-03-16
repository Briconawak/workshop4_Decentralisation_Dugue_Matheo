import bodyParser from "body-parser";
import express from "express";
import { BASE_ONION_ROUTER_PORT, REGISTRY_PORT } from "../config";
import axios from "axios";
import { generateRsaKeyPair } from "../crypto"; // Assuming generateRsaKeyPair is already implemented

export async function simpleOnionRouter(nodeId: number) {
  const onionRouter = express();
  
  // Use express.json() to handle JSON payloads
  onionRouter.use(express.json());

  let lastReceivedEncryptedMessage: string | null = null;
  let lastReceivedDecryptedMessage: string | null = null;
  let lastMessageDestination: number | null = null;

  onionRouter.get("/status", (req, res) => {
    res.send("live");
  });

  onionRouter.get("/getLastReceivedEncryptedMessage", (req, res) => {
    res.json({ result: lastReceivedEncryptedMessage });
  });

  onionRouter.get("/getLastReceivedDecryptedMessage", (req, res) => {
    res.json({ result: lastReceivedDecryptedMessage });
  });

  onionRouter.get("/getLastMessageDestination", (req, res) => {
    res.json({ result: lastMessageDestination });
  });

  const server = onionRouter.listen(BASE_ONION_ROUTER_PORT + nodeId, async () => {
    console.log(
      `Onion router ${nodeId} is listening on port ${BASE_ONION_ROUTER_PORT + nodeId}`
    );

    try {
      // Generate RSA key pair
      const { publicKey } = await generateRsaKeyPair();

      // Register node with the registry service
      await axios.post(`http://localhost:${REGISTRY_PORT}/registerNode`, {
        nodeId,
        pubKey: publicKey,
      });

      console.log(`Node ${nodeId} registered successfully`);
    } catch (error) {
      console.error("Error during RSA key pair generation or registration:", error);
    }
  });

  return server;
}
