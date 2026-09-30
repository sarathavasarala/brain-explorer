// Scene script player.
// Plays a script step by step, coordinating 3D focus/sketch painting,
// route arcs, camera flights, slicing, chemical lens, and body silhouettes.

export function chemLensConfig(chem, { tractsOn = true } = {}) {
  if (!chem) return null;
  const tracts = (chem.tracts || []).map((t) => {
    let state = 'ambient';
    if (typeof tractsOn === 'function') {
      state = tractsOn(t);
    } else if (tractsOn === true) {
      state = 'on';
    } else if (tractsOn === false) {
      state = 'off';
    }
    return {
      id: t.id,
      name: t.name,
      from: t.from,
      to: t.to || [],
      state,
      local: !!t.local,
    };
  });
  return {
    color: chem.color,
    sources: chem.madeIn || [],
    density: chem.density || {},
    tracts,
    group: chem.group,
  };
}

export function playStep(scene, deps, script, index, options = {}) {
  if (!script || !Array.isArray(script.steps) || index < 0 || index >= script.steps.length) {
    return;
  }

  const st = script.steps[index];
  if (!st) return;

  // 1. Chemical lens
  if (st.chemical) {
    const chem = deps.chemById?.get(st.chemical);
    if (chem) {
      const config = deps.chemLensConfig ? deps.chemLensConfig(chem, { tractsOn: true }) : chemLensConfig(chem, { tractsOn: true });
      scene.showChemical(config);
    } else {
      scene.showChemical(null);
    }
  } else {
    scene.showChemical(null);
  }

  // 2. Past and current endpoint IDs
  const past = script.steps.slice(0, index);
  const pastIds = past.flatMap((x) => [
    ...(x.focus || []),
    ...(x.parts || []).map((p) => p.id),
    ...deps.routeEndpoints(x.route),
  ]);
  const currentIds = [
    ...(st.focus || []),
    ...(st.parts || []).map((p) => p.id),
    ...deps.routeEndpoints(st.route),
  ];
  const currentIdSet = new Set(currentIds);

  // 3. Body view: auto-enable when current step targets a body organ
  const hasBodyAnchor = currentIds.some((id) => deps.anchorById?.get(id)?.body);
  const showBody = Boolean(st.body) || hasBodyAnchor;
  scene.setBody(showBody);

  // 4. Slicing state for this step
  let view = st.view;
  const hasParts = Array.isArray(st.parts) && st.parts.length > 0;
  const validParts = hasParts ? st.parts.filter((p) => deps.byId?.has(p.id) || deps.anchorById?.has(p.id)) : [];
  const sliced = hasParts ? validParts.find((p) => deps.byId?.get(p.id)?.slice) : null;
  const forceSlice = showBody ? false : (st.slice !== undefined ? !!st.slice : !!sliced);
  scene.forceSlice(forceSlice);

  // 5. Ambient and current route arcs
  const isArcVisible = (arc) => {
    const fromId = arc.from, toId = arc.to;
    const aFrom = deps.anchorById?.get(fromId), aTo = deps.anchorById?.get(toId);
    if (!showBody && ((aFrom && aFrom.body) || (aTo && aTo.body))) return false;
    if (forceSlice) {
      if (aFrom && !aFrom.mirror && !aFrom.flipWhenSliced && aFrom.position?.[0] > 0.004) return false;
      if (aTo && !aTo.mirror && !aTo.flipWhenSliced && aTo.position?.[0] > 0.004) return false;
    }
    return true;
  };

  const currentRouteArcs = (st.route || []).map((arc) => deps.normalizeArc(arc, true)).filter(isArcVisible);
  const activeKeys = new Set(currentRouteArcs.map((a) => `${a.from}:${a.to}`));

  // Every past-step arc stays as ambient unless it is overridden by the current route
  // or cannot be seen in the current step's scene state.
  const seenArcs = new Set(activeKeys);
  const pastAmbientArcs = [];
  for (const prev of past) {
    for (const rawArc of prev?.route || []) {
      const arc = deps.normalizeArc(rawArc, 'ambient');
      const key = `${arc.from}:${arc.to}`;
      if (seenArcs.has(key)) continue;
      if (isArcVisible(arc)) {
        seenArcs.add(key);
        pastAmbientArcs.push(arc);
      }
    }
  }

  const routeArcs = [...pastAmbientArcs, ...currentRouteArcs];

  // 6. Context elements:
  // Brain structures from past steps stay faintly visible for anatomical reference.
  // Anchors only stay in context if an arc still drawn uses them or the current step names them.
  const activeArcEndpoints = new Set(routeArcs.flatMap((a) => [a.from, a.to]));
  const context = [...new Set([...pastIds, ...currentIds, ...activeArcEndpoints])].filter((id) => {
    const anchor = deps.anchorById?.get(id);
    if (!anchor) return true;
    if (anchor.body && !showBody) return false;
    if (forceSlice && !anchor.mirror && !anchor.flipWhenSliced && anchor.position?.[0] > 0.004) return false;
    return currentIdSet.has(id) || activeArcEndpoints.has(id);
  });

  const isAnchorDrawn = (id) => {
    const anchor = deps.anchorById?.get(id);
    if (!anchor) return true;
    if (anchor.body && !showBody) return false;
    if (forceSlice && !anchor.mirror && !anchor.flipWhenSliced && anchor.position?.[0] > 0.004) return false;
    const hasArc = activeArcEndpoints.has(id);
    const isNamedInStep = (st.focus || []).includes(id) || (st.parts || []).some((p) => p.id === id);
    return isNamedInStep || hasArc;
  };

  // 7. Painting mode: parts vs focus
  if (hasParts) {
    scene.paintSketch(validParts, { context });

    const cut = validParts.filter((p) => p.role === 'cut_off').map((p) => p.id);
    const cutArcs = cut.slice(1).map((id) => ({ from: cut[0], to: id, active: false }));

    if (routeArcs.length > 0) {
      scene.setArcs([...routeArcs, ...cutArcs]);
    } else {
      scene.setArcs(cutArcs);
    }

    if (!view) {
      if (showBody) {
        view = 'body';
      } else {
        view = deps.byId?.get((sliced || validParts[0])?.id)?.view || 'left';
      }
    }

    const frameSource = currentIds.length ? currentIds : validParts.map((p) => p.id);
    const frame = [...new Set(frameSource.filter(isAnchorDrawn))];
    const flightKey = options.key || `${script.id || script.title || 'step'}:${index}`;
    deps.fly(frame, view, flightKey, (view === 'body' || showBody) ? { maxDist: 7.2 } : undefined);
  } else {
    scene.focus(st.focus || [], { context, activity: true, ambient: true });

    scene.setArcs(routeArcs);

    if (!view) {
      view = showBody ? 'body' : 'left';
    }

    const frame = [...new Set(currentIds.filter(isAnchorDrawn))];
    const flightKey = options.key || `${script.id || script.title || 'step'}:${index}`;
    deps.fly(frame, view, flightKey, (view === 'body' || showBody) ? { maxDist: 7.2 } : undefined);
  }
}
