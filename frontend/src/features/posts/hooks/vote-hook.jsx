import {useCallback, useReducer} from "react";
// Assume an API service exists with methods for create, update, delete
import voteService from "#services/voteService"; // Adjust import path as needed

// Enum for vote types (defined locally)
const VoteTypeEnum = {
    UPVOTE: 'upvote',
    DOWNVOTE: 'downvote',
};

// Action Types
const ACTIONS = {
    VOTE_START: 'VOTE_START',
    VOTE_SUCCESS: 'VOTE_SUCCESS', // Represents UI state update & potential vote object update
    VOTE_ERROR: 'VOTE_ERROR',
    SET_STATE: 'SET_STATE',       // Action to directly set state (used for reverting)
};

// Reducer function
function voteReducer(state, action) {
    console.log("Reducer action:", action.type, "Payload:", action.payload);
    switch (action.type) {
        case ACTIONS.VOTE_START:
            // Store previous state before optimistic update
            return {
                ...state,
                isVoting: true,
                voteError: null,
                previousVoteCount: state.voteCount,
                previousVote: state.vote, // Store previous vote object (or null)
            };
        case ACTIONS.VOTE_SUCCESS:
            // Update state with new values, including the potentially updated vote object
        {
            const newVote = action.payload.vote; // This might be null after delete, or updated after create/update
            return {
                ...state,
                isVoting: false,
                voteCount: action.payload.voteCount,
                vote: newVote, // Update the vote object in state
                voteStatus: newVote ? newVote.voteType : null, // Derive status from the new vote object
                voteError: null,
                // postId and commentId remain unchanged by this action
            };
        }
        case ACTIONS.VOTE_ERROR:
            // Keep previous state, just add error and stop loading
            return {
                ...state,
                isVoting: false,
                voteError: action.payload,
                // State is reverted via SET_STATE action in the hook's catch block
            };
        case ACTIONS.SET_STATE:
            // Directly set the state, used for reverting on error
        {
            const revertedVote = action.payload.vote;
            return {
                ...state, // Keep postId and commentId from existing state
                voteCount: action.payload.voteCount,
                vote: revertedVote, // Revert vote object
                voteStatus: revertedVote ? revertedVote.voteType : null, // Derive status
                isVoting: false,
            };
        }
        default:
            return state;
    }
}

// Initializer Function
function initVoteState(initialArgs) {
    const count = typeof initialArgs.initialCount === 'number' && !isNaN(initialArgs.initialCount)
        ? initialArgs.initialCount
        : 0;

    // Expect initialVote to be the full vote object { voteId, voteType, ... } or null
    const initialVote = initialArgs.initialVote || null;
    const initialStatus = initialVote ? initialVote.voteType : null;

    // Get postId and commentId from initialArgs
    const postId = initialArgs.postId || null;
    const commentId = initialArgs.commentId || null;

    // Validate initial status if vote object exists
    if (initialVote && initialStatus !== VoteTypeEnum.UPVOTE && initialStatus !== VoteTypeEnum.DOWNVOTE) {
        console.warn("Initial vote object has invalid voteType:", initialVote);
    }

    if (!postId && !commentId) {
        console.warn("useVote initialized without postId or commentId in initialState.");
    }


    return {
        isVoting: false,
        voteCount: count,
        vote: initialVote, // Store the initial vote object (or null)
        voteStatus: initialStatus, // Derived status
        voteError: null,
        postId: postId, // Store postId in state
        commentId: commentId, // Store commentId in state
        // Store previous state for potential revert on error
        previousVoteCount: count,
        previousVote: initialVote, // Store initial vote as previous
    };
}

// Custom Hook - Now only takes initialState
export default function useVote(initialState) {
    // Pass the initializer function to useReducer
    const [state, dispatch] = useReducer(voteReducer, initialState, initVoteState);

    // Memoized vote handler
    const handleVote = useCallback(async (requestedVoteType) => {
        if (requestedVoteType !== VoteTypeEnum.UPVOTE && requestedVoteType !== VoteTypeEnum.DOWNVOTE) {
            console.error("Invalid vote type requested:", requestedVoteType);
            return;
        }
        if (state.isVoting) return;

        // Get target IDs from state
        const postId = state.postId;
        const commentId = state.commentId;

        // Ensure *at least one* ID is present in state
        if (!postId && !commentId) {
            console.error("No postId or commentId found in hook state for voting.");
            dispatch({type: ACTIONS.VOTE_ERROR, payload: "Missing target ID for vote."});
            return;
        }

        const currentVote = state.vote; // Get the current vote object from state
        const currentStatus = currentVote ? currentVote.voteType : null;

        // --- Determine Optimistic State & Backend Action ---
        let optimisticNextStatus = currentStatus;
        let optimisticNextCount = state.voteCount;
        // Clone current vote for optimistic update, include IDs from state
        let optimisticNextVote = currentVote ? {...currentVote} : null;
        let backendAction = null; // 'create', 'update', 'delete'
        let voteTypeToSend = null; // 'upvote', 'downvote' (only for create/update)

        if (requestedVoteType === currentStatus) {
            // --- Remove Vote ---
            optimisticNextStatus = null;
            optimisticNextCount += (requestedVoteType === VoteTypeEnum.UPVOTE ? -1 : 1);
            optimisticNextVote = null; // Optimistically remove vote object
            backendAction = 'delete';
        } else {
            // --- Create or Update Vote ---
            optimisticNextStatus = requestedVoteType;
            voteTypeToSend = requestedVoteType;

            if (currentStatus === null) {
                // --- Create Vote ---
                optimisticNextCount += (requestedVoteType === VoteTypeEnum.UPVOTE ? 1 : -1);
                // Optimistically set vote type, voteId will be set after API call
                // Include postId and commentId from state in the optimistic object
                optimisticNextVote = {voteType: optimisticNextStatus, postId, commentId};
                backendAction = 'create';
            } else {
                // --- Update/Switch Vote ---
                optimisticNextCount += (requestedVoteType === VoteTypeEnum.UPVOTE ? 2 : -2);
                // Optimistically update vote type in the cloned object
                if (optimisticNextVote) optimisticNextVote.voteType = optimisticNextStatus;
                backendAction = 'update';
            }
        }
        // --- End Calculation ---

        // 1. Start voting and store previous state
        dispatch({type: ACTIONS.VOTE_START});

        // 2. Optimistically update UI state (including the vote object structure)
        dispatch({
            type: ACTIONS.VOTE_SUCCESS,
            payload: {voteCount: optimisticNextCount, vote: optimisticNextVote}
        });

        let finalVoteAfterAPI = optimisticNextVote; // Store the final vote object after API call

        try {
            // 3. Perform API Call based on calculated action
            if (backendAction === 'create') {
                const newVote = await voteService.createVote(
                    postId,           // Pass postId directly
                    commentId,        // Pass commentId directly
                    voteTypeToSend    // Pass voteTypeToSend directly
                );

                console.log("Vote created successfully:", newVote);

                if (!newVote.data.vote || !newVote.data.vote.voteId) {
                    throw new Error("Create vote API did not return a valid vote object with voteId.");
                }
                finalVoteAfterAPI = newVote.data.vote;

            } else if (backendAction === 'update') {
                if (!currentVote || !currentVote.voteId) {
                    throw new Error("Cannot update vote: Previous vote or voteId is missing.");
                }
                const updatedVote = await voteService.updateVote(
                    currentVote.voteId, // Pass voteId directly
                    voteTypeToSend      // Pass voteTypeToSend directly
                );
                finalVoteAfterAPI = updatedVote.data.vote || optimisticNextVote;

            } else if (backendAction === 'delete') {
                if (!currentVote || !currentVote.voteId) {
                    throw new Error("Cannot delete vote: Previous vote or voteId is missing.");
                }
                await voteService.deleteVote(
                    currentVote.voteId // Pass voteId directly
                );
                finalVoteAfterAPI = null;

            } else {
                console.error("Invalid backend action determined:", backendAction);
                throw new Error("Internal error: Invalid vote action.");
            }

            console.log(`API Call (${backendAction}) successful.`);

            // 4. Dispatch final state AFTER successful API call (if different from optimistic)
            if (finalVoteAfterAPI !== optimisticNextVote || (finalVoteAfterAPI && optimisticNextVote && finalVoteAfterAPI.voteId !== optimisticNextVote.voteId)) { // More robust check
                dispatch({
                    type: ACTIONS.VOTE_SUCCESS,
                    payload: {voteCount: optimisticNextCount, vote: finalVoteAfterAPI}
                });
            }


        } catch (error) {
            console.error(`API Vote Error (${backendAction}):`, error);
            // 5. API call failed - Revert UI state and show error
            dispatch({
                type: ACTIONS.SET_STATE, // Use SET_STATE to revert
                payload: {
                    voteCount: state.previousVoteCount,
                    vote: state.previousVote
                }
            });
            dispatch({
                type: ACTIONS.VOTE_ERROR,
                payload: error.message || `Failed to ${backendAction} vote.`
            });
        }

    }, [
        state.isVoting,
        state.voteCount,
        state.vote,
        state.previousVoteCount,
        state.previousVote,
        state.postId, // Add state.postId to dependency array
        state.commentId, // Add state.commentId to dependency array
        // voteService dependency might be needed if it's not stable
    ]);

    // Specific handlers remain the same
    const handleUpvote = useCallback(() => handleVote(VoteTypeEnum.UPVOTE), [handleVote]);
    const handleDownvote = useCallback(() => handleVote(VoteTypeEnum.DOWNVOTE), [handleVote]);

    // Return state and handlers
    return {
        isVoting: state.isVoting,
        voteCount: state.voteCount,
        vote: state.vote, // Return the full vote object (or null)
        voteStatus: state.vote ? state.vote.voteType : null, // Derived status
        voteError: state.voteError,
        handleUpvote,
        handleDownvote,
        // Expose postId and commentId from state if needed by the component
        // postId: state.postId,
        // commentId: state.commentId,
    };
}
