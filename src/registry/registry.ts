import express, { Request, Response } from "express";
import { REGISTRY_PORT } from "../config";

export type Node = { nodeId: number; pubKey: string };

export type RegisterNodeBody = {
  nodeId: number;
  pubKey: string;
};

export type GetNodeRegistryBody = {
  nodes: Node[];
};

let nodeRegistry: Node[] = []; 

export async function launchRegistry() {
  const _registry = express();
  
  // Use express.json() only (no need for bodyParser.json())
  _registry.use(express.json());

  _registry.get("/status", (req: Request, res: Response) => {
    res.send("live");
  });

  _registry.post("/registerNode", (req: Request, res: Response) => {
    const { nodeId, pubKey }: RegisterNodeBody = req.body;

    // Validate the request body
    if (typeof nodeId !== "number" || typeof pubKey !== "string") {
      return res.status(400).json({
        error: "Invalid request body. 'nodeId' must be a number and 'pubKey' must be a string."
      });
    }

    // Check if the node is already registered
    if (nodeRegistry.some((node) => node.nodeId === nodeId)) {
      return res.status(400).json({ error: "Node already registered" });
    }

    // Register the node
    nodeRegistry.push({ nodeId, pubKey });

    console.log(`Node ${nodeId} registered successfully with public key: ${pubKey}`);

    return res.status(200).json({
      message: `Node ${nodeId} registered successfully`,
      nodeId,
      pubKey,
    });
  });

  const server = _registry.listen(REGISTRY_PORT, () => {
    console.log(`Registry is listening on port ${REGISTRY_PORT}`);
  });

  return server;
}
