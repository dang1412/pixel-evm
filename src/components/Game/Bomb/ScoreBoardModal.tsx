import React, { useState } from 'react'

import { PlayerState } from './types'

// --- PlayerState Interface (as a comment, since it's TS syntax) ---
// export interface PlayerState {
//   id: number
//   score: number
//   bombs: number
//   r: number // blastRadius
// }

interface ScoreboardModalProps {
  isOpen: boolean;
  hostName: string;
  players: PlayerState[];
  playerId?: number;
  onClose: () => void;
  onJoinGame: () => void;
}

/**
 * Renders a modal scoreboard displaying player states.
 * @param {object} props
 * @param {boolean} props.isOpen - Whether the modal should be visible.
 * @param {function} props.onClose - Function to call when the modal should be closed.
 * @param {Array<object>} props.players - Array of player state objects.
 */
export const ScoreboardModal: React.FC<ScoreboardModalProps> = ({ isOpen, hostName, players, playerId, onClose, onJoinGame }) => {
  if (!isOpen) {
    return null;
  }

  return (
    // <!-- Modal Overlay -->
    <div
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
      onClick={onClose} // Close modal on overlay click
    >
      {/* <!-- Modal Content --> */}
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl mx-auto overflow-hidden"
        onClick={(e) => e.stopPropagation()} // Prevent overlay click from triggering when clicking content
      >
        {/* <!-- Modal Header --> */}
        <div className="flex justify-between items-center p-5 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Scoreboard ({hostName})
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors rounded-full p-1"
            aria-label="Close modal"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              ></path>
            </svg>
          </button>
        </div>

        {/* <!-- Modal Body - Table --> */}
        <div className="p-5">
          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-left">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Player ID
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Score
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Bombs
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Blast Radius
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white font-semibold dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {players.length > 0 ? (
                  players.map((player) => {
                    const isCurrentPlayer = player.id === playerId;
                    return (
                      <tr
                        key={player.id}
                        className={`${
                          isCurrentPlayer
                            ? 'bg-blue-100 dark:bg-blue-900' // Highlight class
                            : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        <td
                          className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                            isCurrentPlayer
                              ? 'text-blue-900 dark:text-blue-100 font-bold'
                              : 'text-gray-900 dark:text-white'
                          }`}
                        >
                          {player.id}
                        </td>
                        <td
                          className={`px-6 py-4 whitespace-nowrap text-sm ${
                            isCurrentPlayer
                              ? 'text-blue-800 dark:text-blue-200'
                              : 'text-gray-500 dark:text-gray-300'
                          }`}
                        >
                          {player.score}
                        </td>
                        <td
                          className={`px-6 py-4 whitespace-nowrap text-sm ${
                            isCurrentPlayer
                              ? 'text-blue-800 dark:text-blue-200'
                              : 'text-gray-500 dark:text-gray-300'
                          }`}
                        >
                          {player.bombs}
                        </td>
                        <td
                          className={`px-6 py-4 whitespace-nowrap text-sm ${
                            isCurrentPlayer
                              ? 'text-blue-800 dark:text-blue-200'
                              : 'text-gray-500 dark:text-gray-300'
                          }`}
                        >
                          {player.r}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-300"
                    >
                      No players found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* <!-- Modal Footer --> */}
        {!playerId && <div className="flex justify-end items-center p-5 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onJoinGame}
            className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 transition-colors"
          >
            Join Game
          </button>
        </div>}
      </div>
    </div>
  );
}