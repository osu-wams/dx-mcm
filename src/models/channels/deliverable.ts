import { Status } from '@src/models/userMessage';

class Deliverable {
  deliveredAt?: string;

  deliveredStatus?: string;

  setDelivered() {
    this.deliveredAt = new Date().toISOString().slice(0, 10);
    this.deliveredStatus = Status.DELIVERED;
  }
}

export default Deliverable;
