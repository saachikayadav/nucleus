'use client';
import { useForm } from 'react-hook-form';
import { useNucleusStore } from '@/store/useNucleusStore';
import { useCreateIncident } from '@/hooks';
import { RESPONDERS, DEVICES, INCIDENT_TYPES } from '@/config/fleet';
import { useSession } from 'next-auth/react';
import { generateIncidentId } from '@/lib/utils';
import { useState } from 'react';

type FormValues = {
  type: string;
  responder: string;
  device: string;
  location: string;
  notes: string;
};

export default function NewIncidentModal() {
  const open = useNucleusStore((s) => s.incidentModalOpen);
  const setOpen = useNucleusStore((s) => s.setIncidentModalOpen);
  const { data: session } = useSession();
  const { mutate: createIncident, isPending } = useCreateIncident();
  const [selectedResponder, setSelectedResponder] = useState('');

  const { register, handleSubmit, reset, formState: { errors }, watch } = useForm<FormValues>();

  const responderValue = watch('responder');
  const assignedDevice = RESPONDERS.find(r => r.name === responderValue)?.device_id;
  const deviceForResponder = DEVICES.find(d => d.id === assignedDevice);

  if (!open) return null;

  const onClose = () => { setOpen(false); reset(); };

  const onSubmit = (data: FormValues) => {
    createIncident({
      id: generateIncidentId(),
      type: data.type as any,
      responder: data.responder,
      device: data.device || deviceForResponder?.model + ' ' + deviceForResponder?.serial || '',
      location: data.location,
      notes: data.notes,
      status: 'Active',
      created_by: session?.user?.email ?? 'unknown',
    } as any);
    reset();
  };

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">New Incident</div>
          <div className="modal-close" onClick={onClose}>✕</div>
        </div>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Incident Type</label>
              <select className={`form-select${errors.type ? ' error' : ''}`} {...register('type', { required: 'Required' })}>
                <option value="">Select type...</option>
                {INCIDENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              {errors.type && <div className="form-error">{errors.type.message}</div>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Assigned Responder</label>
                <select className={`form-select${errors.responder ? ' error' : ''}`} {...register('responder', { required: 'Required' })}>
                  <option value="">Select responder...</option>
                  {RESPONDERS.map(r => <option key={r.id} value={r.name}>{r.name} · {r.unit}</option>)}
                </select>
                {errors.responder && <div className="form-error">{errors.responder.message}</div>}
              </div>
              <div className="form-group">
                <label className="form-label">AR Device</label>
                <select className={`form-select${errors.device ? ' error' : ''}`} {...register('device', { required: 'Required' })}>
                  <option value="">Select device...</option>
                  {deviceForResponder
                    ? <option value={`${deviceForResponder.model} ${deviceForResponder.serial}`}>{deviceForResponder.model} {deviceForResponder.serial}</option>
                    : DEVICES.map(d => <option key={d.id} value={`${d.model} ${d.serial}`}>{d.model} {d.serial} · {d.unit}</option>)
                  }
                </select>
                {errors.device && <div className="form-error">{errors.device.message}</div>}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Location</label>
              <input className={`form-input${errors.location ? ' error' : ''}`} type="text" placeholder="Address or zone"
                {...register('location', { required: 'Required', minLength: { value: 3, message: 'Min 3 characters' } })} />
              {errors.location && <div className="form-error">{errors.location.message}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">Initial Notes</label>
              <textarea className="form-input" rows={3} placeholder="Brief situational description..." style={{ resize: 'vertical' }}
                {...register('notes')} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-accent" disabled={isPending}>
              {isPending ? 'Deploying...' : 'Deploy Responder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
