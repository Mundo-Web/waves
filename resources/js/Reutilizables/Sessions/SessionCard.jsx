import Tippy from "@tippyjs/react"
import React, { useEffect, useState } from "react"
import { Fetch } from "sode-extend-react";
import SessionsRest from "../../actions/SessionsRest";

const sessionsRest = new SessionsRest()

const SessionCard = ({ onModalOpen, onPingModalOpen, ...session }) => {

  const [isActive, setIsActive] = useState(null)

  useEffect(() => {
    verify()
  }, [null]);

  const verify = async (showNotify = false) => {
    setIsActive(null)
    const verification = await sessionsRest.verify(session.id, showNotify)
    setIsActive(verification)
  }

  return <div className="card">
    <div className="card-body widget-user">
      <div className="d-flex align-items-center">
        <div className="flex-grow-1 overflow-hidden">
          <h5 className="my-0">
            {
              isActive == null
                ? <i className={`mdi mdi-circle me-1 text-muted`}></i>
                : <>
                  {
                    isActive
                      ? <i className='mdi mdi-circle me-1 text-success'></i>
                      : <Tippy content='Verificar'>
                        <i className='mdi mdi-circle me-1 text-danger' style={{
                          cursor: 'pointer'
                        }} onClick={() => verify(true)}></i>
                      </Tippy>
                  }
                </>
            }

            {session?.name}
          </h5>
          <p className="text-muted mb-2 font-13 text-truncate">{session?.metadata?.email ?? '-'}</p>
          <div className='d-flex flex-wrap gap-1'>
            {
              isActive && <Tippy content='Ping'>
                <button className='btn btn-xs btn-dark rounded-pill waves-effect' onClick={() => onPingModalOpen(session)}>
                  <i className='mdi mdi-signal-variant'></i>
                </button>
              </Tippy>
            }
            <Tippy content='Editar'>
              <button className='btn btn-xs btn-primary rounded-pill waves-effect' onClick={() => onModalOpen(session)}>
                <i className='mdi mdi-pencil'></i>
              </button>
            </Tippy>
            <Tippy content='Desactivar'>
              <button className='btn btn-xs btn-light rounded-pill waves-effect'>
                <i className='mdi mdi-toggle-switch text-success'></i>
              </button>
            </Tippy>
          </div>
        </div>
      </div>
    </div>
  </div>
}

export default SessionCard