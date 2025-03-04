import Tippy from "@tippyjs/react"
import React, { useEffect, useRef } from "react"

const SwitchFormGroup = ({ id, col, eRef, label, specification, required = false, onChange, disabled = false, checked, refreshable = null }) => {
  if (!id) id = `ck-${crypto.randomUUID()}`
  if (!eRef) eRef = useRef()

  useEffect(() => {
    new Switchery(eRef.current, {
      size: 'small',
      color: '#64b0f2'
    })
    $(eRef.current).on('change', onChange);
  }, [refreshable])

  return <>
    <div className={`form-group ${col} mb-2`}>
      {
        label &&
        <>
          <label htmlFor={id} className="form-label mb-1 d-block">
            {label} {required && <b className="text-danger">*</b>}
            {specification && <Tippy content={specification}>
              <small className="ms-1 fa fa-question-circle text-muted"></small>
            </Tippy>
            }
          </label>
        </>
      }
      <input ref={eRef} id={id} type="checkbox" data-plugin="switchery" required={required} disabled={disabled} defaultChecked={checked} />
    </div>
  </>
}

export default SwitchFormGroup