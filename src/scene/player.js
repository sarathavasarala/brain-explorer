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

  // 2. Body view
  const showBody = Boolean(st.body);
  scene.setBody(showBody);

  // 3. Past and current endpoint IDs
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
  const context = [...new Set([...pastIds, ...currentIds])];

  // 4. Painting mode: parts vs focus
  let view = st.view;
  const hasParts = Array.isArray(st.parts) && st.parts.length > 0;

  if (hasParts) {
    const validParts = st.parts.filter((p) => deps.byId?.has(p.id) || deps.anchorById?.has(p.id));
    scene.paintSketch(validParts);

    const cut = validParts.filter((p) => p.role === 'cut_off').map((p) => p.id);
    const cutArcs = cut.slice(1).map((id) => ({ from: cut[0], to: id, active: false }));

    const routeArcs = [
      ...past.flatMap((x) => (x.route || []).map((arc) => deps.normalizeArc(arc, 'ambient'))),
      ...(st.route || []).map((arc) => deps.normalizeArc(arc, true)),
    ];

    if (routeArcs.length > 0) {
      scene.setArcs([...routeArcs, ...cutArcs]);
    } else {
      scene.setArcs(cutArcs);
    }

    const sliced = validParts.find((p) => deps.byId?.get(p.id)?.slice);
    const forceSlice = st.slice !== undefined ? !!st.slice : !!sliced;
    scene.forceSlice(forceSlice);

    if (!view) {
      if (showBody) {
        view = 'body';
      } else {
        view = deps.byId?.get((sliced || validParts[0])?.id)?.view || 'left';
      }
    }

    const frame = [...new Set(currentIds.length ? currentIds : validParts.map((p) => p.id))];
    const flightKey = options.key || `${script.id || script.title || 'step'}:${index}`;
    deps.fly(frame, view, flightKey, (view === 'body' || showBody) ? { maxDist: 7.2 } : undefined);
  } else {
    scene.focus(st.focus || [], { context, activity: true, ambient: true });

    scene.setArcs([
      ...past.flatMap((x) => (x.route || []).map((arc) => deps.normalizeArc(arc, 'ambient'))),
      ...(st.route || []).map((arc) => deps.normalizeArc(arc, true)),
    ]);

    scene.forceSlice(!!st.slice);

    if (!view) {
      view = showBody ? 'body' : 'left';
    }

    const frame = [...new Set(currentIds)];
    const flightKey = options.key || `${script.id || script.title || 'step'}:${index}`;
    deps.fly(frame, view, flightKey, (view === 'body' || showBody) ? { maxDist: 7.2 } : undefined);
  }
}
