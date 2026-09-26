import { io, Socket } from "socket.io-client";
import type { ElevatorService } from "./elevatorService";
import type {
  CallDirection,
  Elevator,
  ElevatorId,
  ElevatorRequest,
  RequestStatus,
  SimulationSnapshot,
} from "./simulationTypes";

export class SocketElevatorService implements ElevatorService {
  private socket: Socket;
  private backendUrl: string;
  private listeners = new Set<() => void>();
  private snapshot: SimulationSnapshot;

  constructor(backendUrl?: string) {
    this.backendUrl =
      backendUrl ??
      import.meta.env.VITE_BACKEND_URL ?? "http://localhost:9000";
    this.snapshot = {
      tick: 0,
      running: true,
      connected: false,
      elevators: [
        {
          id: "A",
          currentFloor: 1,
          direction: "IDLE",
          state: "DOOR_CLOSED",
          doorOpen: false,
          doorStatus: "CLOSED",
          doorHeld: false,
          doorCloseCountdown: null,
          requests: [],
          targetFloor: null,
        },
        {
          id: "B",
          currentFloor: 1,
          direction: "IDLE",
          state: "DOOR_CLOSED",
          doorOpen: false,
          doorStatus: "CLOSED",
          doorHeld: false,
          doorCloseCountdown: null,
          requests: [],
          targetFloor: null,
        },
        {
          id: "C",
          currentFloor: 1,
          direction: "IDLE",
          state: "DOOR_CLOSED",
          doorOpen: false,
          doorStatus: "CLOSED",
          doorHeld: false,
          doorCloseCountdown: null,
          requests: [],
          targetFloor: null,
        },
      ],
      requests: [],
    };

    this.socket = io(this.backendUrl, {
      transports: ["websocket", "polling"],
      reconnectionAttempts: 10,
    });

    this.initSocket();
    this.fetchInitialState();
  }

  private initSocket() {
    this.socket.on("connect", () => {
      this.snapshot = { ...this.snapshot, connected: true };
      this.fetchInitialState();
      this.emitChange();
    });

    this.socket.on("disconnect", () => {
      this.snapshot = { ...this.snapshot, connected: false };
      this.emitChange();
    });

    this.socket.on("building.updated", (data: any) => {
      if (data && Array.isArray(data.elevators)) {
        this.updateElevatorsFromBackend(data.elevators);
      }
    });

    this.socket.on("elevator.updated", (data: any) => {
      this.handleElevatorUpdate(data);
    });

    this.socket.on("elevator.arrived", (data: any) => {
      this.handleElevatorUpdate(data);
    });

    this.socket.on("elevator.door.opened", (data: any) => {
      this.handleElevatorUpdate(data);
    });

    this.socket.on("elevator.door.closed", (data: any) => {
      this.handleElevatorUpdate(data);
    });

    this.socket.on("request.created", (data: any) => {
      this.handleRequestEvent(data);
    });

    this.socket.on("request.assigned", (data: any) => {
      this.handleRequestAssigned(data);
    });

    this.socket.on("request.picked_up", (data: any) => {
      this.handleRequestPickedUp(data);
    });

    this.socket.on("request.completed", (data: any) => {
      this.handleRequestCompleted(data);
    });

    this.socket.on("simulation.paused", (data: any) => {
      this.snapshot = {
        ...this.snapshot,
        running: false,
        tick: data?.tick ?? this.snapshot.tick,
      };
      this.emitChange();
    });

    this.socket.on("simulation.resumed", (data: any) => {
      this.snapshot = {
        ...this.snapshot,
        running: true,
        tick: data?.tick ?? this.snapshot.tick,
      };
      this.emitChange();
    });
  }

  private async fetchInitialState() {
    try {
      const [buildingRes, requestsRes, simStatusRes] = await Promise.all([
        fetch(`${this.backendUrl}/api/building`).then((r) => r.json()).catch(() => null),
        fetch(`${this.backendUrl}/api/requests`).then((r) => r.json()).catch(() => null),
        fetch(`${this.backendUrl}/api/simulation/status`).then((r) => r.json()).catch(() => null),
      ]);

      if (buildingRes && Array.isArray(buildingRes.elevators)) {
        this.updateElevatorsFromBackend(buildingRes.elevators);
      }

      if (requestsRes) {
        this.mapBackendRequests(requestsRes);
      }

      if (simStatusRes) {
        this.snapshot = {
          ...this.snapshot,
          running: simStatusRes.running ?? true,
          tick: simStatusRes.tick ?? this.snapshot.tick,
        };
      }

      this.emitChange();
    } catch (e) {
      console.warn("Could not fetch initial backend state", e);
    }
  }

  private mapBackendRequests(requestsData: {
    hallRequests?: any[];
    destinationRequests?: any[];
  }) {
    const list: ElevatorRequest[] = [];

    if (Array.isArray(requestsData.hallRequests)) {
      for (const h of requestsData.hallRequests) {
        const isServed = h.status === "COMPLETED" || h.status === "PICKED_UP";
        list.push({
          id: h.id,
          kind: "HALL",
          floor: h.floor,
          direction: h.direction,
          elevatorId: h.assignedElevatorId ?? null,
          status: this.mapStatus(h.status),
          createdTick: 0,
          // Set already served requests far in the past so their badge is dismissed
          servedTick: isServed ? Math.max(0, this.snapshot.tick - 10) : null,
        });
      }
    }

    if (Array.isArray(requestsData.destinationRequests)) {
      for (const d of requestsData.destinationRequests) {
        const isServed = d.status === "COMPLETED";
        list.push({
          id: d.id,
          kind: "CAR",
          floor: d.destinationFloor,
          direction: null,
          elevatorId: d.elevatorId,
          status: this.mapStatus(d.status),
          createdTick: 0,
          servedTick: isServed ? Math.max(0, this.snapshot.tick - 10) : null,
        });
      }
    }

    this.snapshot = { ...this.snapshot, requests: list };
  }

  private mapStatus(backendStatus: string): RequestStatus {
    switch (backendStatus) {
      case "PENDING":
        return "PENDING";
      case "ASSIGNED":
        return "ASSIGNED";
      case "PICKED_UP":
      case "COMPLETED":
        return "SERVED";
      default:
        return "PENDING";
    }
  }

  private updateElevatorsFromBackend(elevators: any[]) {
    const mapped: Elevator[] = elevators.map((e) => {
      const isDoorOpen = e.door === "OPEN" || e.doorOpen === true;
      return {
        id: e.id,
        currentFloor: e.currentFloor,
        direction: e.direction,
        state: isDoorOpen
          ? "DOOR_OPEN"
          : e.state === "MOVING"
            ? "MOVING"
            : "DOOR_CLOSED",
        doorOpen: isDoorOpen,
        doorStatus: isDoorOpen ? "OPEN" : "CLOSED",
        doorHeld: e.doorHeld ?? false,
        doorCloseCountdown: e.doorCloseCountdown ?? null,
        requests: Array.isArray(e.requests) ? e.requests : [],
        targetFloor: e.targetFloor ?? null,
      };
    });

    // Check if any elevator arrived at a floor with requests
    let hasServedChange = false;
    const nextRequests = this.snapshot.requests.map((r) => {
      if (r.kind === "HALL" && r.status !== "SERVED" && r.elevatorId) {
        const el = mapped.find((e) => e.id === r.elevatorId);
        if (el && el.currentFloor === r.floor && (el.doorOpen || el.state === "STOPPED" || el.state === "DOOR_OPEN")) {
          hasServedChange = true;
          return {
            ...r,
            status: "SERVED" as const,
            servedTick: this.snapshot.tick,
          };
        }
      }
      return r;
    });

    this.snapshot = {
      ...this.snapshot,
      tick: this.snapshot.tick + 1,
      elevators: mapped,
      requests: hasServedChange ? nextRequests : this.snapshot.requests,
    };
    this.emitChange();
  }

  private handleElevatorUpdate(data: any) {
    if (!data || (!data.id && !data.elevatorId)) return;
    const id = data.id ?? data.elevatorId;
    const floor = data.currentFloor ?? data.floor;

    const nextElevators = this.snapshot.elevators.map((e) => {
      if (e.id !== id) return e;

      const isDoorOpen =
        data.door === "OPEN" || data.doorOpen === true || data.state === "DOOR_OPEN";
      return {
        ...e,
        currentFloor: data.currentFloor ?? data.floor ?? e.currentFloor,
        direction: data.direction ?? e.direction,
        state: isDoorOpen
          ? ("DOOR_OPEN" as const)
          : data.state === "MOVING"
            ? ("MOVING" as const)
            : ("DOOR_CLOSED" as const),
        doorOpen: isDoorOpen,
        doorStatus: isDoorOpen ? ("OPEN" as const) : ("CLOSED" as const),
        doorHeld: data.doorHeld ?? e.doorHeld,
        doorCloseCountdown: data.doorCloseCountdown ?? e.doorCloseCountdown,
        requests: data.requests ?? e.requests,
        targetFloor: data.targetFloor !== undefined ? data.targetFloor : e.targetFloor,
      };
    });

    // Mark hall request as SERVED if elevator arrived at that floor
    let hasServedChange = false;
    const isAtStop =
      data.door === "OPEN" ||
      data.doorOpen === true ||
      data.state === "DOOR_OPEN" ||
      data.state === "STOPPED" ||
      data.type === "elevator.arrived";

    const nextRequests = this.snapshot.requests.map((r) => {
      if (r.kind === "HALL" && r.status !== "SERVED" && r.elevatorId === id && r.floor === floor && isAtStop) {
        hasServedChange = true;
        return {
          ...r,
          status: "SERVED" as const,
          servedTick: this.snapshot.tick,
        };
      }
      return r;
    });

    this.snapshot = {
      ...this.snapshot,
      elevators: nextElevators,
      requests: hasServedChange ? nextRequests : this.snapshot.requests,
    };
    this.emitChange();
  }

  private handleRequestEvent(req: any) {
    const existingIndex = this.snapshot.requests.findIndex((r) => r.id === req.id);
    const newReq: ElevatorRequest = {
      id: req.id,
      kind: req.direction ? "HALL" : "CAR",
      floor: req.floor ?? req.destinationFloor,
      direction: req.direction ?? null,
      elevatorId: req.assignedElevatorId ?? req.elevatorId ?? null,
      status: this.mapStatus(req.status),
      createdTick: this.snapshot.tick,
      servedTick: null,
    };

    let nextRequests: ElevatorRequest[];
    if (existingIndex >= 0) {
      nextRequests = [...this.snapshot.requests];
      nextRequests[existingIndex] = newReq;
    } else {
      nextRequests = [newReq, ...this.snapshot.requests];
    }

    this.snapshot = { ...this.snapshot, requests: nextRequests };
    this.emitChange();
  }

  private handleRequestAssigned(data: any) {
    const nextRequests = this.snapshot.requests.map((r) => {
      if (r.id === data.requestId || r.id === data.id) {
        return {
          ...r,
          elevatorId: data.elevatorId,
          status: "ASSIGNED" as const,
        };
      }
      return r;
    });

    this.snapshot = { ...this.snapshot, requests: nextRequests };
    this.emitChange();
  }

  private handleRequestPickedUp(data: any) {
    const reqData = data.data ?? data;
    const reqId = reqData.id ?? data.requestId;

    // Once picked up at the floor, the hall call is SERVED and elevator indicator disappears
    const nextRequests = this.snapshot.requests.map((r) => {
      if (r.id === reqId || (r.floor === reqData.floor && r.elevatorId === (data.elevatorId ?? reqData.assignedElevatorId))) {
        return {
          ...r,
          status: "SERVED" as const,
          servedTick: this.snapshot.tick,
        };
      }
      return r;
    });

    this.snapshot = { ...this.snapshot, requests: nextRequests };
    this.emitChange();
  }

  private handleRequestCompleted(data: any) {
    const reqData = data.data ?? data;
    const reqId = reqData.id ?? data.requestId;

    const nextRequests = this.snapshot.requests.map((r) => {
      if (r.id === reqId) {
        return {
          ...r,
          status: "SERVED" as const,
          servedTick: this.snapshot.tick,
        };
      }
      return r;
    });

    this.snapshot = { ...this.snapshot, requests: nextRequests };
    this.emitChange();
  }

  public getSnapshot = (): SimulationSnapshot => {
    return this.snapshot;
  };

  public getElevators = (): Elevator[] => {
    return this.snapshot.elevators;
  };

  public subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  private emitChange() {
    for (const listener of this.listeners) {
      listener();
    }
  }

  public async callElevator(floor: number, direction: CallDirection): Promise<void> {
    try {
      await fetch(`${this.backendUrl}/api/requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ floor, direction }),
      });
    } catch (e) {
      console.error("callElevator error", e);
    }
  }

  public async selectDestination(elevatorId: ElevatorId, floor: number): Promise<void> {
    try {
      await fetch(`${this.backendUrl}/api/elevators/${elevatorId}/destinations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ floor }),
      });
    } catch (e) {
      console.error("selectDestination error", e);
    }
  }

  public async openDoor(elevatorId: ElevatorId): Promise<void> {
    try {
      await fetch(`${this.backendUrl}/api/elevators/${elevatorId}/door/open`, {
        method: "POST",
      });
    } catch (e) {
      console.error("openDoor error", e);
    }
  }

  public async closeDoor(elevatorId: ElevatorId): Promise<void> {
    try {
      await fetch(`${this.backendUrl}/api/elevators/${elevatorId}/door/close`, {
        method: "POST",
      });
    } catch (e) {
      console.error("closeDoor error", e);
    }
  }

  public async pause(): Promise<void> {
    try {
      await fetch(`${this.backendUrl}/api/simulation/pause`, {
        method: "POST",
      });
    } catch (e) {
      console.error("pause error", e);
    }
  }

  public async resume(): Promise<void> {
    try {
      await fetch(`${this.backendUrl}/api/simulation/resume`, {
        method: "POST",
      });
    } catch (e) {
      console.error("resume error", e);
    }
  }

  public async reset(): Promise<void> {
    try {
      this.snapshot = {
        ...this.snapshot,
        tick: 0,
        requests: [],
      };
      this.emitChange();
      await fetch(`${this.backendUrl}/api/simulation/reset`, {
        method: "POST",
      });
      await this.fetchInitialState();
    } catch (e) {
      console.error("reset error", e);
    }
  }

  public dispose(): void {
    this.socket.disconnect();
    this.listeners.clear();
  }
}
