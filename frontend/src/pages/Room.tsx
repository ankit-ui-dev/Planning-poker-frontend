import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import {
  Box,
  Button,
  Container,
  Heading,
  Input,
  Text,
  VStack,
  HStack,
  SimpleGrid,
  Card,
  CardBody,
  Badge,
  Flex,
  Spacer,
  Divider,
  Progress,
  Tooltip,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  IconButton,
  useColorModeValue,
  Circle,
  Center,
  Avatar,
  FormControl,
  FormLabel,
} from '@chakra-ui/react';
import { FaHistory, FaChartBar, FaRedo, FaShare, FaTrash, FaThumbsUp, FaMinus, FaPlus } from 'react-icons/fa';
import axios from 'axios';
import Lottie from 'lottie-react';
import pokerAnimation from '../assets/animations/cards-animation.json';
import { useToast } from '../utils/toast';

interface Player {
  id: number;
  name: string;
  is_admin: boolean;
}

interface Card {
  id: number;
  player_id: number;
  value: string;
  is_revealed: boolean;
  timestamp: string;
}

interface RoundHistory {
  cards: Card[];
  name: string;
  timestamp: string;
}

interface Room {
  id: number;
  name: string;
  description: string;
  sequence: string[];
  created_at: string;
}

// Default sequence if none is provided
const DEFAULT_SEQUENCE = ['0', '1', '2', '3', '5', '8', '13', '?'];

// Update the LIGHT_COLORS array with better pastel colors
const LIGHT_COLORS = [
  { bg: '#E3F2FD', accent: '#64B5F6' }, // Blue
  { bg: '#E8F5E9', accent: '#81C784' }, // Green
  { bg: '#FFF3E0', accent: '#FFB74D' }, // Orange
  { bg: '#F3E5F5', accent: '#BA68C8' }, // Purple
  { bg: '#E0F7FA', accent: '#4DD0E1' }, // Cyan
  { bg: '#FFF8E1', accent: '#FDD835' }, // Yellow
  { bg: '#FCE4EC', accent: '#F06292' }, // Pink
  { bg: '#E8EAF6', accent: '#7986CB' }, // Indigo
  { bg: '#EFEBE9', accent: '#A1887F' }, // Brown
  { bg: '#E1F5FE', accent: '#4FC3F7' }, // Lighter Blue
  { bg: '#F1F8E9', accent: '#AED581' }, // Lighter Green
  { bg: '#FBE9E7', accent: '#FF8A65' }, // Lighter Orange
  { bg: '#F3E5F5', accent: '#9575CD' }, // Lighter Purple
  { bg: '#E0F2F1', accent: '#4DB6AC' }  // Lighter Teal
];

// Add this function to generate a consistent color for each player
const getPlayerColor = (playerId: number): { bg: string; accent: string } => {
  // Use the player ID to get a consistent color index
  const colorIndex = playerId % LIGHT_COLORS.length;
  return LIGHT_COLORS[colorIndex];
};

// Update the getTableLayout function for circular positioning
const getTableLayout = (playerCount: number) => {
  const getPositions = (count: number) => {
    const positions = [];
    const radius = 52; // Increased radius to position players outside the table
    const centerX = 50;
    const centerY = 50;
    const startAngle = -90; // Start from top
    
    for (let i = 0; i < count; i++) {
      const angle = (startAngle + (i * (360 / count))) * (Math.PI / 180);
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      positions.push({ left: x, top: y });
    }
    
    return positions;
  };
  
  return { positions: getPositions(playerCount) };
};

// Update the PokerTable component
const PokerTable = ({ children, playerCount }: { children: React.ReactNode; playerCount: number }) => {
  return (
    <Center w="full" my={8}>
      <Box
        position="relative"
        width="100%"
        maxWidth="800px"
        height="400px"
        borderRadius="40px"
        bg={useColorModeValue('white', '#2D3748')}
        border="2px solid"
        borderColor={useColorModeValue('#E2E8F0', '#4A5568')}
        overflow="visible"
        boxShadow="xl"
        p={8}
      >
        <Box
          position="absolute"
          top="50%"
          left="50%"
          transform="translate(-50%, -50%)"
          width="60%"
          height="60%"
          borderRadius="20px"
          bg={useColorModeValue('blue.50', 'blue.900')}
          opacity={0.1}
        />
        {children}
      </Box>
    </Center>
  );
};

// Update the PlayerCard component
const PlayerCard = ({ 
  player, 
  card, 
  isCurrentPlayer,
  position,
  totalPlayers
}: { 
  player: Player; 
  card?: Card; 
  isCurrentPlayer: boolean;
  position: number;
  totalPlayers: number;
}) => {
  const playerColor = getPlayerColor(player.id);
  const layout = getTableLayout(totalPlayers);
  const playerPosition = layout.positions[position];
  
  return (
    <Box
      position="absolute"
      left={`${playerPosition.left}%`}
      top={`${playerPosition.top}%`}
      transform="translate(-50%, -50%)"
      zIndex={1}
      transition="all 0.3s ease"
    >
      <VStack spacing={1} alignItems="center">
        {/* User Avatar */}
        <Box
          position="relative"
          opacity={0}
          animation="fadeIn 0.5s ease forwards"
          sx={{
            '@keyframes fadeIn': {
              '0%': { opacity: 0, transform: 'scale(0.9)' },
              '100%': { opacity: 1, transform: 'scale(1)' }
            }
          }}
        >
          <Avatar 
            name={player.name}
            size="md"
            bg={playerColor.accent}
            color="white"
          />
          {card && !card.is_revealed && (
            <Box
              position="absolute"
              top="-2px"
              right="-2px"
              width="20px"
              height="20px"
              bg={playerColor.accent}
              color="white"
              borderRadius="full"
              display="flex"
              alignItems="center"
              justifyContent="center"
              fontSize="xs"
              border="2px solid white"
              boxShadow="0 2px 4px rgba(0,0,0,0.1)"
              zIndex={2}
            >
              ✓
            </Box>
          )}
        </Box>

        {/* Chat Bubble */}
        <Box
          position="relative"
          opacity={0}
          animation="fadeIn 0.5s ease forwards 0.2s"
        >
          <Box
            bg={playerColor.bg}
            px={3}
            py={2}
            borderRadius="xl"
            boxShadow="sm"
            position="relative"
            minW="100px"
            textAlign="center"
            _before={{
              content: '""',
              position: 'absolute',
              top: '-6px',
              left: '50%',
              transform: 'translateX(-50%)',
              borderWidth: '0 6px 6px 6px',
              borderStyle: 'solid',
              borderColor: `transparent transparent ${playerColor.bg} transparent`
            }}
          >
            <VStack spacing={1}>
              <Text 
                fontSize="sm" 
                fontWeight="600"
                color={theme.colors.primary[500]}
                noOfLines={1}
              >
                {player.name}
                {player.is_admin && (
                  <Badge 
                    ml={1} 
                    bg={playerColor.accent}
                    color="white" 
                    fontSize="xs"
                    borderRadius="sm"
                  >
                    👑
                  </Badge>
                )}
              </Text>
              {card?.is_revealed && (
                <Text
                  fontSize="lg"
                  fontWeight="bold"
                  color={playerColor.accent}
                  opacity={0}
                  animation="fadeIn 0.3s ease forwards 0.4s"
                >
                  {card.value}
                </Text>
              )}
            </VStack>
          </Box>
        </Box>
      </VStack>
    </Box>
  );
};

// Add these theme constants at the top after imports
const theme = {
  colors: {
    primary: {
      500: '#2B4D46',
      600: '#234239',
    },
    secondary: {
      100: '#F7FAFC',
      500: '#718096',
    },
    alert: {
      bg: '#FFE9E9',
      text: '#E53E3E',
    }
  },
  spacing: {
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem'
  }
};

const AnimatedBackground = () => (
  <>
    <Box
      position="absolute"
      top="5%"
      left="-5%"
      width="200px"
      opacity={0.1}
      transform="rotate(-15deg)"
      zIndex={0}
    >
      <Lottie animationData={pokerAnimation} loop={true} />
    </Box>
    <Box
      position="absolute"
      bottom="5%"
      right="-5%"
      width="200px"
      opacity={0.1}
      transform="rotate(15deg)"
      zIndex={0}
    >
      <Lottie animationData={pokerAnimation} loop={true} />
    </Box>
  </>
);

interface AxiosError {
  response?: {
    status: number;
  };
}

// Update the AnimatedCardSelection component
const AnimatedCardSelection = ({ 
  sequence, 
  selectedCard, 
  onCardSelect, 
  isRevealed,
  averageScore,
  allCardsSubmitted 
}: { 
  sequence: string[], 
  selectedCard: string | null, 
  onCardSelect: (value: string) => void,
  isRevealed: boolean,
  averageScore: string | null,
  allCardsSubmitted: boolean
}) => {
  return (
    <Box position="relative" width="full" height="full">
      {/* Center message/average display */}
      <Center 
        position="absolute" 
        top="50%" 
        left="50%" 
        transform="translate(-50%, -50%)"
      >
        <Box
          opacity={0}
          animation="fadeIn 0.5s ease forwards"
          sx={{
            '@keyframes fadeIn': {
              '0%': { opacity: 0, transform: 'scale(0.95)' },
              '100%': { opacity: 1, transform: 'scale(1)' }
            }
          }}
        >
          {isRevealed ? (
            <VStack
              bg="white"
              px={4}
              py={3}
              borderRadius="2xl"
              boxShadow="lg"
              spacing={1}
              opacity={0}
              animation="fadeIn 0.5s ease forwards"
            >
              <Text 
                fontSize="md" 
                color={theme.colors.secondary[500]}
              >
                Average Score
              </Text>
              <Heading 
                size="lg" 
                color={theme.colors.primary[500]}
                opacity={0}
                animation="fadeInUp 0.5s ease forwards 0.3s"
                sx={{
                  '@keyframes fadeInUp': {
                    '0%': { opacity: 0, transform: 'translateY(10px)' },
                    '100%': { opacity: 1, transform: 'translateY(0)' }
                  }
                }}
              >
                {averageScore || '-'}
              </Heading>
            </VStack>
          ) : allCardsSubmitted ? (
            <Box
              bg="white"
              px={4}
              py={3}
              borderRadius="xl"
              boxShadow="md"
            >
              <Text 
                color={theme.colors.primary[500]} 
                fontSize="md" 
                fontWeight="medium"
              >
                All votes submitted! Waiting for reveal...
              </Text>
            </Box>
          ) : (
            <Box
              bg="white"
              px={4}
              py={3}
              borderRadius="xl"
              boxShadow="md"
            >
              <Text 
                color={theme.colors.primary[500]} 
                fontSize="md" 
                fontWeight="medium"
              >
                Waiting for votes...
              </Text>
            </Box>
          )}
        </Box>
      </Center>

      {/* Voting numbers - Only show if cards are not revealed */}
      {!isRevealed && (
        <Box
          position="absolute"
          top="65%"
          left="50%"
          transform="translateX(-50%)"
          width="90%"
          maxW="600px"
          opacity={0}
          animation="slideUp 0.5s ease forwards"
          sx={{
            '@keyframes slideUp': {
              '0%': { opacity: 0, transform: 'translate(-50%, 20px)' },
              '100%': { opacity: 1, transform: 'translate(-50%, 0)' }
            }
          }}
        >
          <HStack spacing={2} justify="center" flexWrap="wrap">
            {sequence.map((value, index) => (
              <Box
                key={value}
                opacity={0}
                animation={`fadeIn 0.3s ease forwards ${index * 0.1}s`}
              >
                <Button
                  onClick={() => onCardSelect(value)}
                  variant={selectedCard === value ? "solid" : "outline"}
                  bg={selectedCard === value ? theme.colors.primary[500] : 'white'}
                  color={selectedCard === value ? 'white' : theme.colors.primary[500]}
                  height="44px"
                  minW="44px"
                  fontSize="lg"
                  fontWeight="bold"
                  borderWidth="2px"
                  borderColor={theme.colors.primary[500]}
                  borderRadius="lg"
                  _hover={{
                    bg: selectedCard === value ? theme.colors.primary[600] : 'white',
                    transform: 'translateY(-2px)'
                  }}
                  transition="all 0.2s"
                >
                  {value}
                </Button>
              </Box>
            ))}
          </HStack>
        </Box>
      )}
    </Box>
  );
};

// Update the RoundSubmission component
const RoundSubmission = ({
  roundName,
  setRoundName,
  onSubmit,
  onReveal,
  isAdmin,
  isDisabled,
  cards,
  players,
  showRoundName,
  allCardsSubmitted
}: {
  roundName: string;
  setRoundName: (name: string) => void;
  onSubmit: () => void;
  onReveal: () => void;
  isAdmin: boolean;
  isDisabled: boolean;
  cards: Card[];
  players: Player[];
  showRoundName: boolean;
  allCardsSubmitted: boolean;
}) => {
  return (
    <Card width="full" boxShadow="sm" bg="white">
      <CardBody>
        <VStack spacing={4} align="stretch">
          {isAdmin && showRoundName && (
            <VStack align="start" spacing={1} maxW="300px">
              <FormLabel 
                fontSize="sm" 
                color={theme.colors.secondary[500]} 
                mb={0}
              >
                Round Name (Optional)
              </FormLabel>
              <Input
                placeholder="Enter round name"
                value={roundName}
                onChange={(e) => setRoundName(e.target.value)}
                size="md"
                borderColor={theme.colors.primary[500]}
                _focus={{
                  borderColor: theme.colors.primary[600],
                  boxShadow: `0 0 0 1px ${theme.colors.primary[500]}`
                }}
              />
            </VStack>
          )}
  <Flex justify="center" gap={3}>
            <Button
              onClick={onSubmit}
              bg={theme.colors.primary[500]}
              color="white"
              size="md"
              width="150px"
              isDisabled={isDisabled}
              _hover={{
                bg: theme.colors.primary[600],
                transform: 'translateY(-2px)'
              }}
            >
              Submit Vote
            </Button>
            {isAdmin && (
              <Button
                colorScheme="purple"
                size="md"
                width="150px"
                onClick={onReveal}
                isDisabled={!allCardsSubmitted || cards.some(c => c.is_revealed)}
              >
                Reveal Votes
              </Button>
            )}
          </Flex> 
          
          {/* Submitted Votes List */}
          {cards.length > 0 && (
            <Box width="full">
              <HStack mb={2} justify="space-between">
                <Text 
                  fontSize="sm" 
                  fontWeight="medium" 
                  color={theme.colors.secondary[500]}
                >
                  Submitted Votes
                </Text>
                <Badge 
                  colorScheme="green" 
                  fontSize="sm"
                  borderRadius="full"
                  px={3}
                  py={1}
                >
                  {cards.length}/{players.length} Submitted
                </Badge>
              </HStack>
              <SimpleGrid columns={[2, 3, 4]} spacing={4}>
                {players.map(player => {
                  const playerCard = cards.find(c => c.player_id === player.id);
                  return (
                    <Box 
                      key={player.id}
                      maxW="150px"
                      p={2}
                      borderRadius="md"
                      bg={playerCard ? 'gray.50' : 'transparent'}
                      border="1px solid"
                      borderColor={playerCard ? theme.colors.primary[500] : 'gray.200'}
                    >
                      <HStack>
                        <Avatar size="xs" name={player.name} />
                        <VStack spacing={0} align="start">
                          <Text fontSize="sm" fontWeight="medium" noOfLines={1}>
                            {player.name}
                          </Text>
                          <Text 
                            fontSize="xs" 
                            color={playerCard ? 'green.500' : 'gray.500'}
                          >
                            {playerCard ? 'Submitted' : 'Waiting...'}
                          </Text>
                        </VStack>
                      </HStack>
                    </Box>
                  );
                })}
              </SimpleGrid>
            </Box>
          )}

        
        </VStack>
      </CardBody>
    </Card>
  );
};

function Room() {
  const { roomId: roomCode } = useParams(); // roomId parameter is actually the room code
  const navigate = useNavigate();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [playerName, setPlayerName] = useState(localStorage.getItem('username') || '');
  const [players, setPlayers] = useState<Player[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [roomId, setRoomId] = useState<number | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(
    localStorage.getItem(`submitted_${roomCode}_${playerName}`) === 'true'
  );
  const [allCardsSubmitted, setAllCardsSubmitted] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [roundHistory, setRoundHistory] = useState<RoundHistory[]>([]);
  const [roundName, setRoundName] = useState('');
  const [showRoundName, setShowRoundName] = useState(false);
  const toast = useToast();
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const [roomData, setRoomData] = useState<Room | null>(null);

  useEffect(() => {
    if (!roomCode) {
      toast({
        title: 'Error',
        description: 'Invalid room code',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      navigate('/');
      return;
    }

    // Check if we have a saved username
    const savedUsername = localStorage.getItem('username');
    if (savedUsername) {
      setPlayerName(savedUsername);
    }

    let isComponentMounted = true;
    const newSocket = io('http://localhost:3001');

    // Fetch initial room data including players
    const fetchRoomData = async () => {
      try {
        // First get room by code
        const roomResponse = await axios.get(`http://localhost:3001/api/rooms/code/${roomCode}`);
        const roomInfo = roomResponse.data;
        
        if (!isComponentMounted) return;

        // Then get full room details including players
        const response = await axios.get(`http://localhost:3001/api/rooms/${roomInfo.id}`);
        const roomDetails = response.data;
        const currentPlayers = roomDetails.players || [];
        const existingPlayer = savedUsername ? currentPlayers.find((p: Player) => p.name === savedUsername) : null;

        // Fetch existing cards
        const cardsResponse = await axios.get(`http://localhost:3001/api/rooms/${roomInfo.id}/cards`);
        const existingCards = cardsResponse.data || [];

        if (!isComponentMounted) return;

        // Batch update related state
        setSocket(newSocket);
        setRoomId(roomInfo.id);
        setPlayers(currentPlayers);
        setRoomData(roomDetails);
        setCards(existingCards);

        if (existingPlayer) {
          setIsAdmin(existingPlayer.is_admin);
          const submittedCard = existingCards.find(
            (card: Card) => card.player_id === existingPlayer.id
          );
          if (submittedCard) {
            setSelectedCard(submittedCard.value);
            setHasSubmitted(true);
            localStorage.setItem(`submitted_${roomCode}_${savedUsername}`, 'true');
          }
        } else if (savedUsername) {
          // Auto-join the room with saved username
          try {
            const joinResponse = await axios.post(`http://localhost:3001/api/rooms/${roomInfo.id}/players`, {
              name: savedUsername,
              isAdmin: currentPlayers.length === 0,
            });
            if (!isComponentMounted) return;
            setIsAdmin(joinResponse.data.is_admin);
            setPlayers(prev => [...prev, joinResponse.data]);
          } catch (error) {
            console.error('Error auto-joining room:', error);
          }
        }

        // Check if all cards are submitted
        const allSubmitted = currentPlayers.every((player: Player) =>
          existingCards.some((card: Card) => card.player_id === player.id)
        );
        setAllCardsSubmitted(allSubmitted);

      } catch (error: unknown) {
        console.error('Error fetching room data:', error);
        if (!isComponentMounted) return;
        // Only show error toast if it's a room not found error
        if ((error as AxiosError)?.response?.status === 404) {
          toast({
            title: 'Error',
            description: 'Room not found',
            status: 'error',
            duration: 3000,
            isClosable: true,
          });
          navigate('/');
        }
      }
    };

    fetchRoomData();

    return () => {
      isComponentMounted = false;
      newSocket.close();
    };
  }, [roomCode, navigate, toast]);

  useEffect(() => {
    if (socket && playerName && roomId) {
      // Leave any previous room before joining new one
      socket.emit('leave_room');
      socket.emit('join_room', roomId.toString());

      const handlePlayerJoined = async (player: Player) => {
        try {
          const response = await axios.get(`http://localhost:3001/api/rooms/${roomId}`);
          setPlayers(response.data.players || []);
        } catch (error) {
          console.error('Error fetching updated players:', error);
        }
      };

      const handleCardSubmitted = (card: Card) => {
        setCards(prev => {
          const updatedCards = [...prev];
          const existingIndex = updatedCards.findIndex(c => c.player_id === card.player_id);
          if (existingIndex >= 0) {
            updatedCards[existingIndex] = card;
          } else {
            updatedCards.push(card);
          }
          // Check if all players have submitted after updating cards
          const submittedPlayerIds = new Set(updatedCards.map(c => c.player_id));
          const allSubmitted = players.every(player => submittedPlayerIds.has(player.id));
          if (allSubmitted) {
            // Use setTimeout to avoid state update during render
            setTimeout(() => setAllCardsSubmitted(true), 0);
          }
          return updatedCards;
        });
      };

      const handleAllCardsSubmitted = () => {
        setAllCardsSubmitted(true);
        toast({
          title: 'All Cards Submitted',
          description: 'All players have submitted their cards',
          status: 'info',
          duration: 3000,
          isClosable: true,
        });
      };

      const handleCardsRevealed = (revealedCards: Card[]) => {
        setCards(revealedCards);
        toast({
          title: 'Cards Revealed',
          description: 'The cards have been revealed by the admin',
          status: 'info',
          duration: 3000,
          isClosable: true,
        });
      };

      const handleRoomReset = () => {
        setCards([]);
        setSelectedCard(null);
        setHasSubmitted(false);
        setAllCardsSubmitted(false);
        localStorage.removeItem(`submitted_${roomCode}_${playerName}`);
        toast({
          title: 'Room Reset',
          description: 'The room has been reset by the admin',
          status: 'info',
          duration: 3000,
          isClosable: true,
        });
      };

      const handleRoomDeleted = () => {
        toast({
          title: 'Room Deleted',
          description: 'This room has been deleted by the admin',
          status: 'warning',
          duration: null,
          isClosable: true,
          onCloseComplete: () => navigate('/'),
        });
      };

      socket.on('player_joined', handlePlayerJoined);
      socket.on('card_submitted', handleCardSubmitted);
      socket.on('all_cards_submitted', handleAllCardsSubmitted);
      socket.on('cards_revealed', handleCardsRevealed);
      socket.on('room_reset', handleRoomReset);
      socket.on('room_deleted', handleRoomDeleted);

      // Clean up socket listeners
      return () => {
        socket.off('player_joined', handlePlayerJoined);
        socket.off('card_submitted', handleCardSubmitted);
        socket.off('all_cards_submitted', handleAllCardsSubmitted);
        socket.off('cards_revealed', handleCardsRevealed);
        socket.off('room_reset', handleRoomReset);
        socket.off('room_deleted', handleRoomDeleted);
      };
    }
  }, [socket, roomId, playerName, roomCode, navigate, toast]);

  const checkAllCardsSubmitted = () => {
    const submittedPlayerIds = new Set(cards.map(card => card.player_id));
    const allPlayersSubmitted = players.every(player => submittedPlayerIds.has(player.id));
    setAllCardsSubmitted(allPlayersSubmitted);
  };

  const calculateAverage = () => {
    const numericValues = cards
      .filter(card => card.is_revealed && card.value !== '?')
      .map(card => parseFloat(card.value));
    
    if (numericValues.length === 0) return null;
    
    const sum = numericValues.reduce((a, b) => a + b, 0);
    return (sum / numericValues.length).toFixed(1);
  };

  const handleJoinRoom = async () => {
    if (!roomId || !roomCode || !playerName) return;
    
    try {
      // First, check if the room exists and get current players
      const roomResponse = await axios.get(`http://localhost:3001/api/rooms/${roomId}`);
      const currentPlayers = roomResponse.data.players || [];
      
      // Check if the player is already in the room
      const existingPlayer = currentPlayers.find((p: Player) => p.name === playerName);
      if (existingPlayer) {
        setIsAdmin(existingPlayer.is_admin);
        setPlayers(currentPlayers);
        return;
      }

      // If no players exist, this player becomes admin
      const isFirstPlayer = currentPlayers.length === 0;
      
      const response = await axios.post(`http://localhost:3001/api/rooms/${roomId}/players`, {
        name: playerName,
        isAdmin: isFirstPlayer,
      });
      
      setIsAdmin(response.data.is_admin);
      setPlayers((prev) => [...prev, response.data]);
      
      // Save username in localStorage
      localStorage.setItem('username', playerName);
      
      if (response.data.is_admin) {
        toast({
          title: 'Room Joined',
          description: 'You are the admin of this room',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        toast({
          title: 'Room Joined',
          description: 'You have successfully joined the room',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error joining room:', error);
      // Only show error toast if it's not a case of the player already being in the room
      if (!players.find(p => p.name === playerName)) {
        toast({
          title: 'Error',
          description: 'Failed to join room. Please try again.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    }
  };

  const handleCardSelect = (value: string) => {
    const currentPlayer = players.find((p) => p.name === playerName);
    if (!currentPlayer) return;

    const currentCard = cards.find(c => c.player_id === currentPlayer.id);
    if (currentCard?.is_revealed) {
      toast({
        title: 'Cannot Change Vote',
        description: 'Cards have been revealed. Wait for the next round.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setSelectedCard(value);
  };

  const handleSubmitCard = async () => {
    if (!selectedCard || !roomId) return;

    try {
      const currentPlayer = players.find((p) => p.name === playerName);
      if (!currentPlayer) {
        toast({
          title: 'Error',
          description: 'You are not a member of this room',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      // Check if cards are revealed
      const currentCard = cards.find(c => c.player_id === currentPlayer.id);
      if (currentCard?.is_revealed) {
        toast({
          title: 'Cannot Submit',
          description: 'Cards have been revealed. Wait for the next round.',
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      await axios.post(`http://localhost:3001/api/rooms/${roomId}/cards`, {
        playerId: currentPlayer.id,
        value: selectedCard,
      });

      setHasSubmitted(true);
      localStorage.setItem(`submitted_${roomCode}_${playerName}`, 'true');

      toast({
        title: currentCard ? 'Card Updated' : 'Card Submitted',
        description: currentCard ? 'Your card has been updated' : 'Your card has been submitted',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit card',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleRevealCards = async () => {
    if (!isAdmin) {
      toast({
        title: 'Error',
        description: 'Only admin can reveal cards',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!allCardsSubmitted) {
      toast({
        title: 'Cannot Reveal',
        description: 'Not all players have submitted their cards yet',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // Get the round name (use default if not provided)
    const defaultName = `Round ${roundHistory.length + 1}`;
    const name = roundName.trim() || defaultName;

    try {
      await axios.post(`http://localhost:3001/api/rooms/${roomId}/reveal`);
      
      // Add round to history with name
      const newRound: RoundHistory = {
        cards: [...cards],
        name: name,
        timestamp: new Date().toISOString()
      };
      
      setRoundHistory(prev => [...prev, newRound]);
      
      // Reset round name for next round
      setRoundName('');
    } catch (error) {
      console.error('Error revealing cards:', error);
      toast({
        title: 'Error',
        description: 'Failed to reveal cards',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleResetRoom = async () => {
    if (!isAdmin) {
      toast({
        title: 'Error',
        description: 'Only admin can reset the room',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      await axios.post(`http://localhost:3001/api/rooms/${roomId}/reset`);
      // Clear local state
      setCards([]);
      setSelectedCard(null);
      setHasSubmitted(false);
      setAllCardsSubmitted(false);
      localStorage.removeItem(`submitted_${roomCode}_${playerName}`);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to reset room',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleDeleteRoom = async () => {
    if (!isAdmin) return;

    try {
      const currentPlayer = players.find(p => p.name === playerName);
      if (!currentPlayer) return;

      await axios.delete(`http://localhost:3001/api/rooms/${roomId}`, {
        data: { playerId: currentPlayer.id }
      });
      
      navigate('/');
      toast({
        title: 'Room Deleted',
        description: 'The room has been deleted successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete room',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleShareRoom = () => {
    const roomUrl = `${window.location.origin}/room/${roomCode}`;
    navigator.clipboard.writeText(roomUrl);
    toast({
      title: 'Room URL Copied',
      description: 'Share this URL with others to join the room',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  // Only show the join form if we don't have a username or the user isn't in the players list
  if (!playerName || !players.find(p => p.name === playerName)) {
    return (
      <Box 
        minH="100vh" 
        bg={theme.colors.secondary[100]}
        position="relative"
        overflow="hidden"
      >
        <Container maxW="container.md" py={8}>
          <Card boxShadow="lg">
            <CardBody>
              <VStack spacing={6}>
                <Heading size="lg" color={theme.colors.primary[500]}>Join Planning Room</Heading>
                <Box as="form" onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
                  e.preventDefault();
                  handleJoinRoom();
                }}>
                  <VStack spacing={4} width="full" maxW="md">
                    <FormControl isRequired>
                      <FormLabel color={theme.colors.primary[500]}>Your Name</FormLabel>
                      <Input
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value)}
                        placeholder="Enter your name"
                        bg="white"
                        size="lg"
                        borderColor={theme.colors.primary[500]}
                        _focus={{
                          borderColor: theme.colors.primary[600],
                          boxShadow: `0 0 0 1px ${theme.colors.primary[500]}`
                        }}
                        _hover={{
                          borderColor: theme.colors.primary[600],
                        }}
                      />
                    </FormControl>
                    <Button 
                      onClick={handleJoinRoom}
                      bg={theme.colors.primary[500]}
                      color="white"
                      size="lg"
                      width="full"
                      isDisabled={!playerName.trim()}
                      _hover={{
                        bg: theme.colors.primary[600],
                        transform: 'translateY(-2px)',
                      }}
                      transition="all 0.2s"
                    >
                      Join Room
                    </Button>
                  </VStack>
                </Box>
              </VStack>
            </CardBody>
          </Card>
        </Container>
      </Box>
    );
  }

  const submittedCount = cards.length;
  const totalPlayers = players.length;
  const submissionProgress = (submittedCount / totalPlayers) * 100;
  const average = calculateAverage();

  // Split players into two rows
  const midPoint = Math.ceil(players.length / 2);
  const topRowPlayers = players.slice(0, midPoint);
  const bottomRowPlayers = players.slice(midPoint);

  return (
    <Box 
      minH="100vh" 
      bg={theme.colors.secondary[100]}
      position="relative"
      overflow="hidden"
    >
      <AnimatedBackground />
      
      <Container maxW="container.xl" py={6} position="relative">
        <VStack spacing={6}>
          <Card width="full" boxShadow="lg">
            <CardBody>
              <VStack spacing={8} align="stretch">
                {/* Room Info and Controls */}
                <Flex 
                  width="full" 
                  justify="space-between" 
                  align="flex-start"
                  gap={4}
                >
                  {/* Room Info */}
                  <VStack align="start" spacing={2} flex="1">
                    <Heading size="lg" color={theme.colors.primary[500]}>
                      {roomData?.name || 'Planning Room'}
                    </Heading>
                    {roomData?.description && (
                      <Text 
                        color={theme.colors.secondary[500]}
                        fontSize="md"
                        maxW="600px"
                      >
                        {roomData.description}
                      </Text>
                    )}
                    <HStack spacing={2} mt={2}>
                      <Text fontSize="sm" color={theme.colors.secondary[500]}>
                        Add Label
                      </Text>
                      {isAdmin && (
                        <IconButton
                          aria-label="Add round name"
                          icon={showRoundName ? <FaMinus /> : <FaPlus />}
                          size="sm"
                          variant="ghost"
                          color={theme.colors.primary[500]}
                          onClick={() => setShowRoundName(!showRoundName)}
                        />
                      )}
                    </HStack>
                  </VStack>

                  {/* Controls */}
                  <HStack spacing={3}>
                    <Button 
                      onClick={() => setShowHistory(!showHistory)}
                      bg={theme.colors.primary[500]}
                      color="white"
                      size="sm"
                      leftIcon={<FaHistory />}
                      _hover={{ bg: theme.colors.primary[600] }}
                    >
                      {showHistory ? 'Hide History' : 'Show History'}
                    </Button>
                    <Button 
                      onClick={handleShareRoom}
                      bg={theme.colors.primary[500]}
                      color="white"
                      size="sm"
                      leftIcon={<FaShare />}
                      _hover={{ bg: theme.colors.primary[600] }}
                    >
                      Share
                    </Button>
                    {isAdmin && (
                      <>
                        <Button 
                          onClick={handleResetRoom} 
                          variant="outline"
                          borderColor={theme.colors.primary[500]}
                          color={theme.colors.primary[500]}
                          size="sm"
                          leftIcon={<FaRedo />}
                        >
                          Reset
                        </Button>
                        <Button 
                          onClick={handleDeleteRoom} 
                          variant="outline"
                          borderColor="red.500"
                          color="red.500"
                          size="sm"
                          leftIcon={<FaTrash />}
                        >
                          Delete
                        </Button>
                      </>
                    )}
                  </HStack>
                </Flex>

                <Box width="full" position="relative" minHeight="400px">
                  <PokerTable playerCount={players.length}>
                    <AnimatedCardSelection
                      sequence={roomData?.sequence || DEFAULT_SEQUENCE}
                      selectedCard={selectedCard}
                      onCardSelect={handleCardSelect}
                      isRevealed={cards.some(c => c.is_revealed)}
                      averageScore={calculateAverage()}
                      allCardsSubmitted={allCardsSubmitted}
                    />
                    {players.map((player, index) => (
                      <PlayerCard
                        key={player.id}
                        player={player}
                        card={cards.find(c => c.player_id === player.id)}
                        isCurrentPlayer={player.name === playerName}
                        position={index}
                        totalPlayers={players.length}
                      />
                    ))}
                  </PokerTable>
                </Box>

                {/* Round Submission Section */}
                <RoundSubmission
                  roundName={roundName}
                  setRoundName={setRoundName}
                  onSubmit={handleSubmitCard}
                  onReveal={handleRevealCards}
                  isAdmin={isAdmin}
                  isDisabled={!selectedCard || hasSubmitted}
                  cards={cards}
                  players={players}
                  showRoundName={showRoundName}
                  allCardsSubmitted={allCardsSubmitted}
                />
              </VStack>
            </CardBody>
          </Card>

          {/* History section */}
          {showHistory && roundHistory.length > 0 && (
            <Card width="full" boxShadow="md">
              <CardBody>
                <VStack spacing={6} align="stretch">
                  <Heading size="md" color={theme.colors.primary[500]}>
                    Previous Rounds
                  </Heading>
                  {roundHistory.map((round, index) => (
                    <Box key={round.timestamp}>
                      <Flex justify="space-between" align="center" mb={3}>
                        <Text fontWeight="bold" color={theme.colors.primary[500]}>
                          {round.name}
                        </Text>
                        <Text fontSize="sm" color={theme.colors.secondary[500]}>
                          {new Date(round.timestamp).toLocaleString()}
                        </Text>
                      </Flex>
                      <Flex gap={4} flexWrap="wrap" justify="center">
                        {round.cards.map((card) => (
                          <Card 
                            key={card.id} 
                            variant="outline" 
                            borderColor={theme.colors.primary[500]}
                            minW="120px"
                          >
                            <CardBody>
                              <VStack>
                                <Text 
                                  fontSize="xl" 
                                  fontWeight="bold"
                                  color={theme.colors.primary[500]}
                                >
                                  {card.value}
                                </Text>
                                <Text fontSize="sm" color={theme.colors.secondary[500]}>
                                  {players.find((p) => p.id === card.player_id)?.name}
                                </Text>
                              </VStack>
                            </CardBody>
                          </Card>
                        ))}
                      </Flex>
                      {index < roundHistory.length - 1 && (
                        <Divider my={4} borderColor={theme.colors.secondary[500]} opacity={0.3} />
                      )}
                    </Box>
                  ))}
                </VStack>
              </CardBody>
            </Card>
          )}
        </VStack>
      </Container>
    </Box>
  );
}

export default Room; 