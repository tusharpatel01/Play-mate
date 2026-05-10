import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { MessageCircle, Search, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import {
  fetchChats, fetchChatById, setActiveChat,
  selectChats, selectActiveChatId, selectChatById,
} from "../features/chat/chatSlice";
import { selectCurrentUser } from "../features/auth/authSlice";
import { ChatListItem, ChatWindow } from "../components/chat";
import { EmptyState, Spinner } from "../components/common";
import { getSocket, joinChatRoom } from "../socket/socket";

export default function ChatPage() {
  const { chatId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectCurrentUser);
  const chats = useSelector(selectChats);
  const activeChatId = useSelector(selectActiveChatId);
  const activeChat = useSelector(selectChatById(activeChatId));
  const [search, setSearch] = useState("");
  const [chatsLoading, setChatsLoading] = useState(true);

  // ─── Load all chats on mount ────────────────────
  useEffect(() => {
    setChatsLoading(true);
    dispatch(fetchChats()).finally(() => setChatsLoading(false));
  }, [dispatch]);

  // ─── Re-join socket rooms whenever chats load ───
  useEffect(() => {
    if (chats.length === 0) return;
    const socket = getSocket();
    if (socket?.connected) {
      socket.emit("join:rooms", chats.map((c) => c._id));
    }
  }, [chats]);

  // ─── Handle URL :chatId param ───────────────────
  useEffect(() => {
    if (!chatId) {
      dispatch(setActiveChat(null));
      return;
    }

    // Check if chat is already loaded
    const existing = chats.find((c) => c._id === chatId);

    if (existing) {
      dispatch(setActiveChat(chatId));
      joinChatRoom(chatId);
    } else if (!chatsLoading) {
      // Not in list, fetch single
      dispatch(fetchChatById(chatId))
        .unwrap()
        .then(() => {
          dispatch(setActiveChat(chatId));
          joinChatRoom(chatId);
        })
        .catch(() => {
          // Chat not found or no access
          navigate("/chat");
        });
    }
  }, [chatId, chats, chatsLoading, dispatch, navigate]);

  const filteredChats = chats.filter((c) => {
    if (!search) return true;
    const other = c.participants?.find((p) => p._id !== user?._id);
    const name = c.type === "direct" ? other?.name : c.name;
    return name?.toLowerCase().includes(search.toLowerCase());
  });

  // Group chats by type for clarity
  const groupChats = filteredChats.filter((c) => c.type === "group");
  const directChats = filteredChats.filter((c) => c.type === "direct");

  return (
    <div className="flex h-screen overflow-hidden">
      {/* ─── Chat list sidebar ───────────────────────── */}
      <div
        className={`w-full md:w-72 flex-shrink-0 border-r border-white/[0.07] flex flex-col
          ${activeChatId ? "hidden md:flex" : "flex"}`}
      >
        <div className="p-4 border-b border-white/[0.07]">
          <h1 className="text-lg font-bold mb-3">Messages</h1>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search chats..."
              className="input pl-9 py-2 text-sm"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {chatsLoading ? (
            <div className="flex justify-center py-8">
              <Spinner size={24} />
            </div>
          ) : filteredChats.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <MessageCircle size={28} className="text-slate-600 mb-3" />
              <p className="text-slate-400 text-sm font-medium">
                No conversations yet
              </p>
              <p className="text-slate-600 text-xs mt-1 leading-relaxed">
                Join a match or send a request — chats appear here once you're accepted.
              </p>
            </div>
          ) : (
            <>
              {/* ─── Match Groups ─── */}
              {groupChats.length > 0 && (
                <div className="mb-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-2 py-1.5">
                    Match Groups · {groupChats.length}
                  </p>
                  {groupChats.map((chat) => (
                    <ChatListItem
                      key={chat._id}
                      chat={chat}
                      isActive={chat._id === activeChatId}
                      currentUserId={user?._id}
                      onClick={() => navigate(`/chat/${chat._id}`)}
                    />
                  ))}
                </div>
              )}

              {/* ─── Direct Messages ─── */}
              {directChats.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-2 py-1.5">
                    Direct Messages · {directChats.length}
                  </p>
                  {directChats.map((chat) => (
                    <ChatListItem
                      key={chat._id}
                      chat={chat}
                      isActive={chat._id === activeChatId}
                      currentUserId={user?._id}
                      onClick={() => navigate(`/chat/${chat._id}`)}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ─── Chat window ─────────────────────────────── */}
      <div className={`flex-1 flex flex-col ${!activeChatId ? "hidden md:flex" : "flex"}`}>
        {/* Mobile back button */}
        {activeChatId && (
          <button
            onClick={() => navigate("/chat")}
            className="md:hidden flex items-center gap-2 text-slate-400 px-4 py-3 border-b border-white/[0.07]"
          >
            <ArrowLeft size={16} /> Back to chats
          </button>
        )}

        {activeChat ? (
          <motion.div
            key={activeChat._id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex flex-col"
          >
            <ChatWindow chat={activeChat} />
          </motion.div>
        ) : (
          <EmptyState
            icon={MessageCircle}
            title="Select a conversation"
            description="Choose a chat from the left to start messaging"
          />
        )}
      </div>
    </div>
  );
}
