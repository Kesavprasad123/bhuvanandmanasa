import React, { useEffect, useRef } from 'react';
import html from '../markup/invitation.html?raw';
import '../styles/style.css';
import initInvitation from '../scripts/invitation.js';

export default function InvitationPage() {
  const ref = useRef(null);

  useEffect(() => {
    document.title = 'Bhuvan & Manasa | Wedding Invitation';
    document.body.className = 'locked';
    initInvitation();
  }, []);

  return <div ref={ref} dangerouslySetInnerHTML={{ __html: html }} />;
}
