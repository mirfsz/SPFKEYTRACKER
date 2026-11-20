import React, { useEffect, useMemo, useState } from 'react';
import SupportUpkeep from './components/SupportUpkeep';
import { generateReport } from './data/report';
import CompanyNav from './components/CompanyNav';
import KeyGrid from './components/KeyGrid';
import Toast from './components/Toast';
import { KEY_REASONS, buildInitialData, loadTrackerData, saveTrackerData, isValidTrackerData } from './data/keyData';


function App() {
  const [data, setData] = useState(loadTrackerData);
  const [company, setCompany] = useState('CHARLIE');
  const [mode, setMode] = useState('track');
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState([]);
  const [selecting, setSelecting] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [toast, setToast] = useState(null);
  const [deadline, setDeadline] = useState(null);
  const [expired, setExpired] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    const refresh = async () => {
      try {
        let config;
        try {
          const response = await fetch('/api/support?action=status', { cache: 'no-store', signal: controller.signal });
          if (!response.ok) throw new Error('Service unavailable');
          config = await response.json();
        } catch {
          const response = await fetch(`${process.env.PUBLIC_URL || ''}/support.json`, { cache: 'no-store', signal: controller.signal });
          if (!response.ok) return;
          config = await response.json();
        }
        if (Number.isFinite(Date.parse(config.deadline))) {
          setDeadline(config.deadline);
          setExpired(Date.now() >= Date.parse(config.deadline));
        }
      } catch (error) { /* Keep the last known deadline while offline. */ }
    };
    refresh();
    const interval = setInterval(refresh, 60000);
    return () => { controller.abort(); clearInterval(interval); };
  }, []);
  const keys = data.companies[company];

  const counts = useMemo(() => {
    const records = Object.values(keys);
    return {
      in: records.filter((key) => key.condition === 'usable' && key.location === 'in').length,
      out: records.filter((key) => key.condition === 'usable' && key.location === 'out').length,
      unusable: records.filter((key) => key.condition === 'unusable').length,
      review: records.filter((key) => key.needsReview).length,
    };
  }, [keys]);

  const commit = (nextData, message) => {
    const stamped = { ...nextData, updatedAt: new Date().toISOString() };
    setData(stamped);
    saveTrackerData(stamped);
    if (message) setToast(message);
  };

  const toggleLocation = (keyNumber) => {
    if (expired) return;
    const key = keys[keyNumber];
    if (key.condition !== 'usable') {
      setToast(`Key ${keyNumber} is unusable. Open Manage keys to change it.`);
      return;
    }
    const location = key.location === 'out' ? 'in' : 'out';
    commit({
      ...data,
      companies: {
        ...data.companies,
        [company]: { ...keys, [keyNumber]: { ...key, location, updatedAt: new Date().toISOString() } },
      },
    }, `Key ${keyNumber} marked ${location === 'in' ? 'in fridge' : 'drawn out'}.`);
  };

  const applyCondition = (condition, reason = null) => {
    if (expired) return;
    if (!selected.length) return;
    const nextKeys = { ...keys };
    selected.forEach((keyNumber) => {
      nextKeys[keyNumber] = {
        ...nextKeys[keyNumber], condition, reason: condition === 'unusable' ? reason : null,
        needsReview: false, updatedAt: new Date().toISOString(),
      };
    });
    commit({ ...data, companies: { ...data.companies, [company]: nextKeys } }, `${selected.length} ${selected.length === 1 ? 'key' : 'keys'} updated.`);
    setSelected([]);
  };

  const updateSelection = (keyNumber) => {
    if (mode === 'track' && keys[keyNumber].condition !== 'usable') {
      setToast('Use Manage keys to change unusable keys.');
      return;
    }
    setSelected((current) => current.includes(keyNumber)
      ? current.filter((number) => number !== keyNumber)
      : [...current, keyNumber]);
  };

  const switchCompany = (nextCompany) => {
    setCompany(nextCompany);
    setSelected([]);
    setSelecting(false);
    setFilter('all');
  };

  const leaveManageMode = () => {
    setMode('track');
    setSelected([]);
    setSelecting(false);
  };

  const applyLocation = (location) => {
    if (expired) return;
    const nextKeys = { ...keys };
    selected.forEach(number => {
      if (nextKeys[number].condition === 'usable') nextKeys[number] = { ...nextKeys[number], location, updatedAt: new Date().toISOString() };
    });
    commit({ ...data, companies: { ...data.companies, [company]: nextKeys } }, `Selected keys marked ${location === 'in' ? 'in fridge' : 'drawn out'}.`);
    setSelected([]);
    setSelecting(false);
  };

  const report = showReport ? generateReport(data) : '';

  const copyReport = async () => {
    if (expired) return;
    try {
      await navigator.clipboard.writeText(report);
      setToast('Report copied.');
      setShowReport(false);
    } catch (error) {
      setToast('Could not copy automatically. Select the report text and copy it.');
    }
  };

  const exportBackup = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `key-tracker-backup-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setShowMenu(false);
    setToast('Backup downloaded.');
  };

  const resetDemo = () => {
    if (!window.confirm('Reset all local records to the supplied Charlie and Delta lists?')) return;
    commit(buildInitialData(), 'Local records reset.');
    setShowMenu(false);
  };

  const importBackup = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const imported = JSON.parse(await file.text());
      const valid = isValidTrackerData(imported);
      if (!valid) throw new Error('Invalid backup');
      commit(imported, 'Backup restored on this device.');
      setShowMenu(false);
    } catch (error) {
      setToast('That file is not a valid Key board backup.');
    } finally {
      event.target.value = '';
    }
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div><p className="product-name">Key board</p></div>
        <button className="icon-button" onClick={() => setShowMenu(true)} aria-label="Open settings"><span aria-hidden="true">•••</span></button>
      </header>

      <main>
        <section className="company-strip" aria-label="Company selection"><CompanyNav currentCompany={company} onSelectCompany={switchCompany} /></section>
        <SupportUpkeep deadline={deadline} onExpand={() => setShowMenu(true)} onExpired={setExpired} />
        <section className="board-heading">
          <div>
            <p className="company-kicker">{company} company</p>
            <h1>{mode === 'manage' ? 'Manage usable keys' : 'Where are the keys?'}</h1>
            <p className="board-help">{mode === 'manage' ? 'Select keys, then set whether they can be used.' : 'Tap a usable key when it is drawn or returned.'}</p>
          </div>
          <button className="mode-button" disabled={expired} onClick={() => mode === 'manage' ? leaveManageMode() : setMode('manage')}>{mode === 'manage' ? 'Done' : 'Manage keys'}</button>
        </section>

        <section className="summary-row" aria-label="Key summary">
          <button className={filter === 'in' ? 'summary active' : 'summary'} onClick={() => setFilter(filter === 'in' ? 'all' : 'in')}><strong>{counts.in}</strong><span>In fridge</span></button>
          <button className={filter === 'out' ? 'summary active' : 'summary'} onClick={() => setFilter(filter === 'out' ? 'all' : 'out')}><strong>{counts.out}</strong><span>Drawn</span></button>
          <button className={filter === 'unusable' ? 'summary active' : 'summary'} onClick={() => setFilter(filter === 'unusable' ? 'all' : 'unusable')}><strong>{counts.unusable}</strong><span>Unusable</span></button>
          {counts.review > 0 && <button className={filter === 'review' ? 'summary attention active' : 'summary attention'} onClick={() => setFilter(filter === 'review' ? 'all' : 'review')}><strong>{counts.review}</strong><span>Review</span></button>}
        </section>

        <div inert={expired ? '' : undefined}><KeyGrid keys={keys} mode={mode} filter={filter} selected={selected} onToggle={toggleLocation} onSelect={updateSelection} selecting={selecting} onSelectRange={(numbers) => { setSelected(numbers); setSelecting(true); }} /></div>
        <p className="updated-time">Saved on this device · Updated {new Date(data.updatedAt).toLocaleString('en-SG')}</p>
      </main>

      {expired ? <nav className="bottom-bar"><button className="primary-action" onClick={() => setShowMenu(true)}>Support upkeep · View backup</button></nav> : mode === 'track' && !selecting ? (
        <nav className="bottom-bar" aria-label="Key actions"><button className="select-action" onClick={() => setSelecting(true)}>Select keys</button><button className="primary-action" onClick={() => setShowReport(true)}>Preview report</button></nav>
      ) : (
        <div className="manage-bar">
          <div className="selection-count"><strong>{selected.length}</strong><span>selected</span></div>
          <div className="manage-actions">
            {mode === 'track' ? <>
              <button disabled={!selected.length} onClick={() => applyLocation('in')}>Return</button>
              <button disabled={!selected.length} onClick={() => applyLocation('out')}>Draw out</button>
              <button onClick={() => { setSelected([]); setSelecting(false); }}>Cancel</button>
            </> : <>
            <button onClick={() => applyCondition('usable')} disabled={!selected.length}>Set usable</button>
            <details>
              <summary aria-disabled={!selected.length}>Set unusable</summary>
              <div className="reason-menu">{KEY_REASONS.map((reason) => <button key={reason.value} onClick={() => applyCondition('unusable', reason.value)} disabled={!selected.length}>{reason.label}</button>)}</div>
            </details>
            </>}
          </div>
        </div>
      )}

      {showReport && !expired && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setShowReport(false)}>
          <section className="sheet" role="dialog" aria-modal="true" aria-labelledby="report-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="sheet-handle" /><div className="sheet-header"><div><p className="company-kicker">All 9 companies</p><h2 id="report-title">Key report</h2></div><button className="icon-button" onClick={() => setShowReport(false)} aria-label="Close report">×</button></div>
            <textarea className="report-text" value={report} readOnly aria-label="Generated key report" />
            <button className="primary-action" onClick={copyReport}>Copy report</button>
          </section>
        </div>
      )}

      {showMenu && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setShowMenu(false)}>
          <section className="sheet compact" role="dialog" aria-modal="true" aria-labelledby="settings-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="sheet-handle" /><div className="sheet-header"><h2 id="settings-title">This device</h2><button className="icon-button" onClick={() => setShowMenu(false)} aria-label="Close settings">×</button></div>
            <p className="settings-note">This preview saves locally. Download a backup before handing the role to another phone.</p>
            <SupportUpkeep deadline={deadline} expanded />
            <button className="menu-row" onClick={exportBackup}><span>Download backup</span><span>JSON</span></button>
            <label className="menu-row file-row"><span>Restore backup</span><span>Choose file</span><input type="file" accept="application/json,.json" onChange={importBackup} /></label>
            <button className="menu-row danger" onClick={resetDemo}><span>Reset local records</span><span>Start again</span></button>
          </section>
        </div>
      )}

      <Toast show={Boolean(toast)} message={toast || ''} type="success" onClose={() => setToast(null)} />
    </div>
  );
}

export default App;
