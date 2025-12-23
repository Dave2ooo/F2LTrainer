Understanding KPattern pieces and orientation arrays for 3x3x3 cube:

EDGES orbit (12 pieces):

Standard position order: UF(0), UR(1), UB(2), UL(3), DF(4), DR(5), DB(6), DL(7), FR(8), FL(9), BR(10), BL(11)
pieces[i] = which edge piece is currently in position i (value 0-11)
orientation[i] = orientation of the edge in position i (0 = correct, 1 = flipped)
Solved state: pieces = [0,1,2,3,4,5,6,7,8,9,10,11], orientation = [0,0,0,0,0,0,0,0,0,0,0,0]
CORNERS orbit (8 pieces):

Standard position order: UFR(0), URB(1), UBL(2), ULF(3), DRF(4), DFL(5), DLB(6), DBR(7)
pieces[i] = which corner piece is currently in position i (value 0-7)
orientation[i] = twist of the corner in position i (0 = correct, 1 = clockwise twist, 2 = counter-clockwise twist)
Solved state: pieces = [0,1,2,3,4,5,6,7], orientation = [0,0,0,0,0,0,0,0]
Example: If CORNERS. pieces = [7,6,4,5,1,2,3,0] and CORNERS.orientation = [0,2,1,0,0,0,0,0], then:

Position 0 (UFR) contains corner piece #7 (DBR) with correct orientation
Position 1 (URB) contains corner piece #6 (DLB) with counter-clockwise twist
Position 2 (UBL) contains corner piece #4 (DRF) with clockwise twist
To check if a piece is solved: pieces[i] === i && orientation[i] === 0
