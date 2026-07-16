import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

export type PortalDestination = {
  latitude: number;
  longitude: number;
  name: string;
};

export type PortalGpsPosition = {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude: number | null;
  heading: number | null;
  speed: number | null;
  timestamp: number;
};

export type PortalRouteStep = {
  instruction: string;
  name: string;
  distance: number;
  duration: number;
  latitude: number;
  longitude: number;
  routeIndex: number;
};

export type PortalRoute = {
  coordinates: [number, number][];
  distance: number;
  duration: number;
  steps: PortalRouteStep[];
};

type OsrmStep = {
  distance: number;
  duration: number;
  name: string;
  maneuver: {
    type: string;
    modifier?: string;
    location: [number, number];
  };
};

type OsrmResponse = {
  code: string;
  message?: string;
  routes?: Array<{
    distance: number;
    duration: number;
    geometry: {
      coordinates: [number, number][];
      type: "LineString";
    };
    legs: Array<{
      steps: OsrmStep[];
    }>;
  }>;
};

type UsePortalNavigationOptions = {
  destination: PortalDestination | null;
  voiceEnabled?: boolean;
  followLocation?: boolean;
  routingServer?: string;
  onLocationChange?: (
    position: PortalGpsPosition
  ) => void;
};

const EARTH_RADIUS_METERS = 6_371_000;
const OFF_ROUTE_DISTANCE_METERS = 60;
const REROUTE_DELAY_MS = 12_000;

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

function distanceBetween(
  latitude1: number,
  longitude1: number,
  latitude2: number,
  longitude2: number
): number {
  const latitudeDifference = toRadians(
    latitude2 - latitude1
  );

  const longitudeDifference = toRadians(
    longitude2 - longitude1
  );

  const firstLatitude = toRadians(latitude1);
  const secondLatitude = toRadians(latitude2);

  const haversine =
    Math.sin(latitudeDifference / 2) ** 2 +
    Math.cos(firstLatitude) *
      Math.cos(secondLatitude) *
      Math.sin(longitudeDifference / 2) ** 2;

  return (
    2 *
    EARTH_RADIUS_METERS *
    Math.atan2(
      Math.sqrt(haversine),
      Math.sqrt(1 - haversine)
    )
  );
}

function findNearestRouteIndex(
  latitude: number,
  longitude: number,
  coordinates: [number, number][]
): {
  index: number;
  distance: number;
} {
  if (coordinates.length === 0) {
    return {
      index: 0,
      distance: Number.POSITIVE_INFINITY,
    };
  }

  let nearestIndex = 0;
  let nearestDistance = Number.POSITIVE_INFINITY;

  /*
   * Checking every second route point reduces work on long routes.
   */
  for (
    let index = 0;
    index < coordinates.length;
    index += 2
  ) {
    const [routeLongitude, routeLatitude] =
      coordinates[index];

    const distance = distanceBetween(
      latitude,
      longitude,
      routeLatitude,
      routeLongitude
    );

    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestIndex = index;
    }
  }

  return {
    index: nearestIndex,
    distance: nearestDistance,
  };
}

function buildInstruction(step: OsrmStep): string {
  const roadName = step.name?.trim();
  const roadText = roadName
    ? ` onto ${roadName}`
    : "";

  const modifier = step.maneuver.modifier
    ?.replaceAll("_", " ")
    .trim();

  switch (step.maneuver.type) {
    case "depart":
      return roadName
        ? `Begin on ${roadName}`
        : "Begin your route";

    case "arrive":
      return "You have arrived at your destination";

    case "merge":
      return `Merge${
        modifier ? ` ${modifier}` : ""
      }${roadText}`;

    case "fork":
      return `Keep${
        modifier ? ` ${modifier}` : ""
      }${roadText}`;

    case "roundabout":
    case "rotary":
      return `Enter the roundabout${roadText}`;

    case "continue":
    case "new name":
      return `Continue${
        modifier ? ` ${modifier}` : ""
      }${roadText}`;

    case "end of road":
      return `At the end of the road, turn ${
        modifier || "onto the next road"
      }${roadText}`;

    case "turn":
    default:
      return `Turn ${
        modifier || "ahead"
      }${roadText}`;
  }
}

function formatDistance(distanceMeters: number): string {
  if (distanceMeters < 305) {
    const feet = Math.max(
      50,
      Math.round(
        (distanceMeters * 3.28084) / 50
      ) * 50
    );

    return `${feet} feet`;
  }

  const miles = distanceMeters / 1609.344;

  if (miles < 10) {
    return `${miles.toFixed(1)} miles`;
  }

  return `${Math.round(miles)} miles`;
}

function formatDuration(seconds: number): string {
  const totalMinutes = Math.max(
    1,
    Math.round(seconds / 60)
  );

  if (totalMinutes < 60) {
    return `${totalMinutes} min`;
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (minutes === 0) {
    return `${hours} hr`;
  }

  return `${hours} hr ${minutes} min`;
}

export function createAccuracyCircle(
  position: PortalGpsPosition,
  points = 48
) {
  const coordinates: [number, number][] = [];

  const latitudeRadius =
    position.accuracy / 111_320;

  const longitudeRadius =
    position.accuracy /
    (111_320 *
      Math.cos(toRadians(position.latitude)));

  for (let index = 0; index <= points; index++) {
    const angle = (index / points) * Math.PI * 2;

    coordinates.push([
      position.longitude +
        Math.cos(angle) * longitudeRadius,
      position.latitude +
        Math.sin(angle) * latitudeRadius,
    ]);
  }

  return {
    type: "Feature",
    properties: {},
    geometry: {
      type: "Polygon",
      coordinates: [coordinates],
    },
  };
}

export function usePortalNavigation({
  destination,
  voiceEnabled = true,
  followLocation = true,
  routingServer =
    "https://router.project-osrm.org",
  onLocationChange,
}: UsePortalNavigationOptions) {
  const [position, setPosition] =
    useState<PortalGpsPosition | null>(null);

  const [route, setRoute] =
    useState<PortalRoute | null>(null);

  const [isTracking, setIsTracking] =
    useState(false);

  const [isNavigating, setIsNavigating] =
    useState(false);

  const [isRouting, setIsRouting] =
    useState(false);

  const [gpsError, setGpsError] =
    useState<string | null>(null);

  const [currentInstruction, setCurrentInstruction] =
    useState<string>("");

  const [remainingDistance, setRemainingDistance] =
    useState(0);

  const [remainingDuration, setRemainingDuration] =
    useState(0);

  const [offRoute, setOffRoute] =
    useState(false);

  const watchIdRef = useRef<number | null>(null);
  const positionRef =
    useRef<PortalGpsPosition | null>(null);
  const routeRef = useRef<PortalRoute | null>(null);
  const destinationRef =
    useRef<PortalDestination | null>(destination);
  const navigatingRef = useRef(false);
  const routingRef = useRef(false);
  const lastRerouteRef = useRef(0);
  const spokenInstructionsRef =
    useRef(new Set<string>());

  useEffect(() => {
    destinationRef.current = destination;
  }, [destination]);

  const speak = useCallback(
    (text: string, interrupt = false) => {
      if (
        !voiceEnabled ||
        !("speechSynthesis" in window)
      ) {
        return;
      }

      if (interrupt) {
        window.speechSynthesis.cancel();
      }

      const utterance =
        new SpeechSynthesisUtterance(text);

      utterance.rate = 1;
      utterance.pitch = 1;
      utterance.volume = 1;

      const voices =
        window.speechSynthesis.getVoices();

      const preferredVoice = voices.find(
        (voice) =>
          voice.lang.startsWith("en") &&
          /natural|google|microsoft|samantha/i.test(
            voice.name
          )
      );

      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      window.speechSynthesis.speak(utterance);
    },
    [voiceEnabled]
  );

  const requestRoute = useCallback(
    async (
      origin: PortalGpsPosition,
      target: PortalDestination,
      announceRoute: boolean
    ) => {
      if (routingRef.current) {
        return;
      }

      routingRef.current = true;
      setIsRouting(true);
      setGpsError(null);

      try {
        const coordinates =
          `${origin.longitude},${origin.latitude};` +
          `${target.longitude},${target.latitude}`;

        const url =
          `${routingServer}/route/v1/driving/` +
          `${coordinates}` +
          "?overview=full" +
          "&geometries=geojson" +
          "&steps=true" +
          "&alternatives=false";

        const response = await fetch(url, {
          headers: {
            Accept: "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(
            `Routing failed with status ${response.status}.`
          );
        }

        const data =
          (await response.json()) as OsrmResponse;

        if (
          data.code !== "Ok" ||
          !data.routes?.length
        ) {
          throw new Error(
            data.message || "No route was found."
          );
        }

        const firstRoute = data.routes[0];
        const routeCoordinates =
          firstRoute.geometry.coordinates;

        const routeSteps =
          firstRoute.legs[0]?.steps || [];

        const steps: PortalRouteStep[] =
          routeSteps.map((step) => {
            const [longitude, latitude] =
              step.maneuver.location;

            const nearest =
              findNearestRouteIndex(
                latitude,
                longitude,
                routeCoordinates
              );

            return {
              instruction: buildInstruction(step),
              name: step.name || "",
              distance: step.distance,
              duration: step.duration,
              latitude,
              longitude,
              routeIndex: nearest.index,
            };
          });

        const newRoute: PortalRoute = {
          coordinates: routeCoordinates,
          distance: firstRoute.distance,
          duration: firstRoute.duration,
          steps,
        };

        routeRef.current = newRoute;
        setRoute(newRoute);
        setRemainingDistance(firstRoute.distance);
        setRemainingDuration(firstRoute.duration);
        setOffRoute(false);

        spokenInstructionsRef.current.clear();

        const firstInstruction =
          steps[0]?.instruction ||
          "Navigation started";

        setCurrentInstruction(firstInstruction);

        if (announceRoute) {
          speak(
            `Navigation started to ${target.name}. ` +
              `The trip is ${formatDistance(
                firstRoute.distance
              )} and should take about ${formatDuration(
                firstRoute.duration
              )}. ${firstInstruction}.`,
            true
          );
        } else {
          speak(
            `Route updated. ${firstInstruction}.`,
            true
          );
        }
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Unable to calculate the route.";

        setGpsError(message);
      } finally {
        routingRef.current = false;
        setIsRouting(false);
      }
    },
    [routingServer, speak]
  );

  const updateNavigation = useCallback(
    (newPosition: PortalGpsPosition) => {
      const activeRoute = routeRef.current;
      const activeDestination =
        destinationRef.current;

      if (
        !navigatingRef.current ||
        !activeDestination
      ) {
        return;
      }

      if (!activeRoute) {
        void requestRoute(
          newPosition,
          activeDestination,
          true
        );

        return;
      }

      const nearest = findNearestRouteIndex(
        newPosition.latitude,
        newPosition.longitude,
        activeRoute.coordinates
      );

      const isOffRoute =
        nearest.distance >
        OFF_ROUTE_DISTANCE_METERS;

      setOffRoute(isOffRoute);

      if (isOffRoute) {
        const now = Date.now();

        if (
          now - lastRerouteRef.current >=
          REROUTE_DELAY_MS
        ) {
          lastRerouteRef.current = now;

          speak("You are off route. Recalculating.", true);

          void requestRoute(
            newPosition,
            activeDestination,
            false
          );
        }

        return;
      }

      const progress =
        activeRoute.coordinates.length > 1
          ? nearest.index /
            (activeRoute.coordinates.length - 1)
          : 0;

      const distanceLeft = Math.max(
        0,
        activeRoute.distance * (1 - progress)
      );

      const durationLeft = Math.max(
        0,
        activeRoute.duration * (1 - progress)
      );

      setRemainingDistance(distanceLeft);
      setRemainingDuration(durationLeft);

      const nextStep =
        activeRoute.steps.find(
          (step) =>
            step.routeIndex >= nearest.index
        ) ||
        activeRoute.steps[
          activeRoute.steps.length - 1
        ];

      if (!nextStep) {
        return;
      }

      setCurrentInstruction(nextStep.instruction);

      const distanceToManeuver = distanceBetween(
        newPosition.latitude,
        newPosition.longitude,
        nextStep.latitude,
        nextStep.longitude
      );

      let announcementKey = "";
      let announcement = "";

      if (distanceToManeuver <= 30) {
        announcementKey =
          `${nextStep.routeIndex}-now`;

        announcement = nextStep.instruction;
      } else if (distanceToManeuver <= 120) {
        announcementKey =
          `${nextStep.routeIndex}-near`;

        announcement =
          `In ${formatDistance(
            distanceToManeuver
          )}, ${nextStep.instruction.toLowerCase()}`;
      } else if (distanceToManeuver <= 500) {
        announcementKey =
          `${nextStep.routeIndex}-approach`;

        announcement =
          `In ${formatDistance(
            distanceToManeuver
          )}, ${nextStep.instruction.toLowerCase()}`;
      }

      if (
        announcementKey &&
        !spokenInstructionsRef.current.has(
          announcementKey
        )
      ) {
        spokenInstructionsRef.current.add(
          announcementKey
        );

        speak(announcement, true);
      }

      const destinationDistance = distanceBetween(
        newPosition.latitude,
        newPosition.longitude,
        activeDestination.latitude,
        activeDestination.longitude
      );

      if (destinationDistance <= 35) {
        speak(
          `You have arrived at ${activeDestination.name}.`,
          true
        );

        navigatingRef.current = false;
        setIsNavigating(false);
        setCurrentInstruction(
          "You have arrived"
        );
        setRemainingDistance(0);
        setRemainingDuration(0);
      }
    },
    [requestRoute, speak]
  );

  const handlePosition = useCallback(
    (geolocationPosition: GeolocationPosition) => {
      const coordinates =
        geolocationPosition.coords;

      const newPosition: PortalGpsPosition = {
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        accuracy: coordinates.accuracy,
        altitude: coordinates.altitude,
        heading: coordinates.heading,
        speed: coordinates.speed,
        timestamp: geolocationPosition.timestamp,
      };

      positionRef.current = newPosition;
      setPosition(newPosition);
      setGpsError(null);

      onLocationChange?.(newPosition);
      updateNavigation(newPosition);
    },
    [onLocationChange, updateNavigation]
  );

  const handlePositionError = useCallback(
    (error: GeolocationPositionError) => {
      let message: string;

      switch (error.code) {
        case error.PERMISSION_DENIED:
          message =
            "Location permission was denied. Enable location access for The Portal.";
          break;

        case error.POSITION_UNAVAILABLE:
          message =
            "Your location is currently unavailable.";
          break;

        case error.TIMEOUT:
          message =
            "The GPS request timed out. Try moving near a window or outside.";
          break;

        default:
          message =
            "The Portal could not access your location.";
      }

      setGpsError(message);
      setIsTracking(false);
    },
    []
  );

  const startTracking = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setGpsError(
        "This device does not support browser GPS."
      );

      return;
    }

    if (watchIdRef.current !== null) {
      return;
    }

    setGpsError(null);
    setIsTracking(true);

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 15_000,
      maximumAge: 2_000,
    };

    navigator.geolocation.getCurrentPosition(
      handlePosition,
      handlePositionError,
      options
    );

    watchIdRef.current =
      navigator.geolocation.watchPosition(
        handlePosition,
        handlePositionError,
        options
      );
  }, [handlePosition, handlePositionError]);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(
        watchIdRef.current
      );

      watchIdRef.current = null;
    }

    setIsTracking(false);
  }, []);

  const startNavigation = useCallback(async () => {
    const currentPosition = positionRef.current;
    const currentDestination =
      destinationRef.current;

    if (!currentDestination) {
      setGpsError(
        "Choose a destination before starting navigation."
      );

      return;
    }

    if (!currentPosition) {
      startTracking();

      setGpsError(
        "Waiting for your GPS location. Press Start Navigation again when your location appears."
      );

      return;
    }

    navigatingRef.current = true;
    setIsNavigating(true);
    setGpsError(null);

    await requestRoute(
      currentPosition,
      currentDestination,
      true
    );
  }, [requestRoute, startTracking]);

  const stopNavigation = useCallback(() => {
    navigatingRef.current = false;

    setIsNavigating(false);
    setRoute(null);
    setCurrentInstruction("");
    setRemainingDistance(0);
    setRemainingDuration(0);
    setOffRoute(false);

    routeRef.current = null;
    spokenInstructionsRef.current.clear();

    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(
          watchIdRef.current
        );
      }

      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return {
    position,
    route,
    isTracking,
    isNavigating,
    isRouting,
    gpsError,
    offRoute,
    currentInstruction,
    remainingDistance,
    remainingDuration,
    formattedDistance:
      formatDistance(remainingDistance),
    formattedDuration:
      formatDuration(remainingDuration),
    followLocation,
    startTracking,
    stopTracking,
    startNavigation,
    stopNavigation,
    speak,
  };
}
