function createState(initialValue, undoRedoLimit = 10) {
  let state = initialValue;
  const listeners = new Set();
  const middleware = [];
  const stateHistory = [initialValue];
  let historyIndex = 0;
  const customEvents = {};
  const actionLogs = [];
  const errors = [] || "something went wrong";
  const undoRedoStack = [];
  let isBatching = false;
  const batchedListeners = new Set();
  const globalStateListeners = new Set();
  const globalActions = {};
  const modules = {};
  async function setState(newValue) {
    if (isBatching) {
      batchedListeners.add(newValue);
    } else {
      const oldValue = state;
      try {
        for (const fn of middleware) {
          newValue = await fn(newValue, oldValue);
        }
      } catch (error) {
        console.error("Middleware Error:", error);
        return;
      }
      if (oldValue !== newValue) {
        stateHistory.splice(historyIndex + 1);
        stateHistory.push(newValue);
        historyIndex = stateHistory.length - 1;
        state = {
          ...newValue,
        }; // Ensure state immutability

        for (const listener of listeners) {
          if (typeof listener === "function") {
            listener(state, oldValue);
          }
        }

        for (const listener of globalStateListeners) {
          if (typeof listener === "function") {
            listener(state, oldValue);
          }
        }

        // Add the action to the undo stack
        undoRedoStack.push({
          state: {
            ...newValue,
          },
          actionLogs: [...actionLogs],
        });

        // Trim the undo stack if it exceeds the limit
        if (undoRedoStack.length > undoRedoLimit) {
          undoRedoStack.shift();
        }
      }
    }
  }

  function subscribe(callback) {
    listeners.add(callback);

    return function unsubscribe() {
      listeners.delete(callback);
    };
  }

  function addMiddleware(fn, position = "last") {
    if (position === "first") {
      middleware.unshift(fn);
    } else {
      middleware.push(fn);
    }
  }

  function getErrors(e) {
    return errors.find((err) => err.hasOwnProperty(e))[e];
  }

  function undo() {
    if (historyIndex > 0) {
      historyIndex--;
      const newState = {
        ...stateHistory[historyIndex],
      }; // Ensure state immutability
      const oldState = {
        ...stateHistory[historyIndex + 1],
      };
      state = newState;

      for (const listener of listeners) {
        if (typeof listener === "function") {
          listener(newState, oldState);
        }
      }
    }
  }

  function redo() {
    if (historyIndex < stateHistory.length - 1) {
      historyIndex++;
      const newState = {
        ...stateHistory[historyIndex],
      };
      const oldState = {
        ...stateHistory[historyIndex - 1],
      };
      state = newState;

      for (const listener of listeners) {
        if (typeof listener === "function") {
          listener(newState, oldState);
        }
      }
    }
  }

  function select(selector) {
    return selector(state);
  }

  function persistToLocalStorage(key) {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch (error) {
      console.error("LocalStorage Error:", error);
    }
  }

  function loadFromLocalStorage(key) {
    try {
      const savedState = localStorage.getItem(key);
      if (savedState !== null) {
        state = JSON.parse(savedState);
        for (const listener of listeners) {
          if (typeof listener === "function") {
            listener(state, null);
          }
        }
      }
    } catch (error) {
      console.error("LocalStorage Error:", error);
    }
  }

  function on(event, handler) {
    if (!customEvents[event]) {
      customEvents[event] = [];
    }
    customEvents[event].push(handler);
  }

  function emit(event, data) {
    if (customEvents[event]) {
      for (const handler of customEvents[event]) {
        try {
          handler(data);
        } catch (error) {
          console.error("Event Handler Error:", error);
        }
      }
    }
  }

  function startBatch() {
    isBatching = true;
  }

  function endBatch() {
    isBatching = false;
    for (const listener of batchedListeners) {
      if (typeof listener === "function") {
        listener(state, null);
      }
    }
    batchedListeners.clear();
  }

  function registerModule(namespace, moduleName, moduleState) {
    if (!modules[namespace]) {
      modules[namespace] = {};
    }
    const module = createState(moduleState);

    module.actions = {};

    module.dispatchAsync = async function (actionName, payload) {
      if (module.actions[actionName]) {
        try {
          const result = await module.actions[actionName](payload);
          actionLogs.push({
            module: moduleName,
            action: actionName,
            payload,
          });
          return result;
        } catch (error) {
          console.error("Module Action Error:", error);
        }
      }
    };

    modules[namespace][moduleName] = module;
  }

  function unregisterModule(namespace, moduleName) {
    if (modules[namespace] && modules[namespace][moduleName]) {
      delete modules[namespace][moduleName];
    }
  }

  function getModule(namespace, moduleName) {
    return modules[namespace] && modules[namespace][moduleName];
  }

  function takeSnapshot() {
    return JSON.parse(JSON.stringify(state));
  }

  function restoreSnapshot(snapshot) {
    state = {
      ...snapshot,
    };
    for (const listener of listeners) {
      if (typeof listener === "function") {
        listener(state, null);
      }
    }
  }

  function subscribeToGlobalState(callback) {
    globalStateListeners.add(callback);

    return function unsubscribe() {
      globalStateListeners.delete(callback);
    };
  }
  function getActionLogs() {
    return actionLogs;
  }

  function replayActionLog(logIndex) {
    if (logIndex >= 0 && logIndex < actionLogs.length) {
      const log = actionLogs[logIndex];
      if (modules[log.module]) {
        const module = modules[log.module][log.action];
        if (module && typeof module === "function") {
          module(log.payload);
        }
      }
    }
  }

  function createActions(obj) {
    Object.keys(obj).forEach((key) => {
      globalActions[key] = obj[key];
    });
  }

  async function dispatchGlobalAction(actionName, payload) {
    try {
      const result = await globalActions[actionName](payload);
      actionLogs.push({
        module: "global",
        action: actionName,
        payload,
      });
      return result;
    } catch (error) {
      console.error("Global Action Error:", error);
    }
  }

  function enforceTypes(data, typeSchema) {
    // Implement strict type checking here
  }

  return {
    getState: () => state,
    setState,
    subscribe,
    addMiddleware,
    undo,
    redo,
    select,
    getErrors,
    persistToLocalStorage,
    loadFromLocalStorage,
    on,
    emit,
    startBatch,
    endBatch,
    registerModule,
    unregisterModule,
    getModule,
    takeSnapshot,
    restoreSnapshot,
    getActionLogs,
    replayActionLog,
    dispatchGlobalAction,
    enforceTypes,
    subscribeToGlobalState,
    createActions,
  };
}
