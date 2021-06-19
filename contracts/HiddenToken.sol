pragma solidity 0.8.5;

contract HiddenToken {
    uint256 private _totalSupply;
    string public name;
    string public symbol;
    mapping (address => uint256) private _balanceOf;
    mapping(address => mapping(address => uint256)) private _allowances;

    event Transfer(address indexed _from, address indexed _to, uint256 _value);
    event Approval(address indexed owner_, address indexed spender_, uint256 value_);

   constructor(string memory name_, string memory symbol_, uint256 totalSupply_) {
       name = name_;
       symbol = symbol_;
       _totalSupply = totalSupply_;
       _balanceOf[msg.sender] = totalSupply_;
   }

   function totalSupply() public view returns(uint) {
       return _totalSupply;
   }

   function allowance(address owner_, address spender_) public view returns(uint256) {
       return _allowances[owner_][spender_];
   }

   function balanceOf(address address_) public view returns(uint) {
       return _balanceOf[address_];
   }

   function transfer(address to_, uint value_) public returns(bool) {
       require(_balanceOf[msg.sender] >= value_, 'You do not have enough tokens');
       
       _balanceOf[msg.sender] -= value_;
       _balanceOf[to_] += value_;

       emit Transfer(msg.sender, to_, value_);
       return true;
   }

   function approve(address spender_, uint256 value_) public returns(bool) {
        require(msg.sender != address(0), "ERC20: approve from the zero address");
        require(spender_ != address(0), "ERC20: approve to the zero address");

        _allowances[msg.sender][spender_] = value_;
        
        emit Approval(msg.sender, spender_, value_);
        return true;
   }
}